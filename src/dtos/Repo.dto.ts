export type RepoDto = {
    id: bigint,
    owner: string,
    name: string,
    url: string,
    stars: number,
    forks: number,
    watchings: number,
    language: string,
    description: string,
    readme: string,
    topics: string[],
}

export function summary(repo: RepoDto): string {
    return `${repo.owner}/${repo.name}, ${repo.stars} stars, ${repo.forks} forks, in ${repo.language}. 
        link: ${repo.url},
        description: ${repo.description}
        `;
}
