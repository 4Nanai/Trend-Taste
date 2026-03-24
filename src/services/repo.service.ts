import type { Repo } from "@generated/client";
import type { RepoDto } from "../dtos/Repo.dto";
import type { RepoBasicDto } from "../dtos/RepoBasic.dto";
import { findRepoById, createRepo, findRepoByOwnerAndName, updateRepo } from "../repositories/repo.repo";
import { fetchRepoMeta } from "../utils/github-api";
import { parseRepoMeta } from "../parser/repo-parser";
import { logger } from "../utils/logger";
import { repoFetchingLock } from "../utils/lock";

/**
 * Prepare repository with meta information from GitHub API
 * Retrieves from database
 * If not in database, fetches from GitHub API and stores it
 * @param repoBasicDto 
 * @returns Repo or null
 */
export async function prepareRepo(repoBasicDto: RepoBasicDto): Promise<Repo | null> {
    const servLogger = logger.child({repo: `${repoBasicDto.owner}/${repoBasicDto.name}`});
    try {
        const maxRetries = 5;
        let delayMs = 1000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const repo = await findRepoByOwnerAndName(repoBasicDto.owner, repoBasicDto.name);
            if (repo && repo.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) { // if repo is updated within last 24 hours
                servLogger.info(`Repo retrieved from database successfully`);
                return repo;
            } else if (repo) { // repo exists but outdated
                servLogger.info(`Repo found in database but outdated, updating from GitHub API, attempt ${attempt}/${maxRetries}`);
            } else { // repo not found
                servLogger.info(`Repo not found in database, fetching from GitHub API, attempt ${attempt}/${maxRetries}`);
            }
            const repoDto = await fetchRepoWithLock(repoBasicDto);
            if (repoDto) {
                const repo = await saveRepo(repoDto);
                servLogger.info(`Repo prepared successfully`);
                return repo;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs)); // wait for 1 second before retrying
            delayMs += 1000;
        }
        servLogger.warn(`Failed to prepare repo after ${maxRetries} attempts`);
        return null;
    } catch (error) {
        servLogger.error({err: error}, `Error preparing repo ${repoBasicDto.owner}/${repoBasicDto.name}`);
        throw new Error(`Error fetching repo ${repoBasicDto.owner}/${repoBasicDto.name}: ${error}`);
    }
}

/**
 * Fetch repo meta with locking to prevent concurrent repeated GitHub API calls
 * @param repoBasicDto 
 * @returns RepoDto or null
 */
async function fetchRepoWithLock(repoBasicDto: RepoBasicDto): Promise<RepoDto | null> {
    const lockKey = `${repoBasicDto.owner}/${repoBasicDto.name}`;
    let locked = false;
    try {
        locked = repoFetchingLock.acquire(lockKey);
        if (locked) {
            const repoMetaData = await fetchRepoMeta(repoBasicDto.owner, repoBasicDto.name);
            const repoDto = parseRepoMeta(repoMetaData, repoBasicDto);
            return repoDto;
        }
        return null;
    } catch (error) {
        return null
    } finally {
        if (locked) {
            repoFetchingLock.release(lockKey);
        }
    }
}

/**
 * Save repo to database if not exists
 * @param repo 
 * @returns Repo
 */
export async function saveRepo(repoDto: RepoDto): Promise<Repo> {
    const repo: Omit<Repo, 'createdAt' | 'updatedAt'> = {
        id: repoDto.id,
        owner: repoDto.owner,
        name: repoDto.name,
        url: repoDto.url,
        description: repoDto.description,
        stars: repoDto.stars,
        forks: repoDto.forks,
        watchings: repoDto.watchings,
        language: repoDto.language,
        topics: repoDto.topics,
    }
    try {
        const existingRepo = await findRepoById(repo.id);
        logger.info({repoId: repo.id, repo: `${repo.owner}/${repo.name}`}, existingRepo ? "Repo exists, updating..." : "Repo does not exist, creating...");
        if (existingRepo) {
            const updatedRepo = await updateRepo(repo.id, repo);
            return updatedRepo;
        }
        const newRepo = await createRepo(repo);
        return newRepo;
    } catch (error) {
        throw new Error(`Error saving repo ${repo.owner}/${repo.name}: ${error}`);
    }
}