export function convertMdToHtml(text: string): string {
    let htmlText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    htmlText = htmlText.replace(/^- /gm, '• ');
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<i>$1</i>');
    htmlText = htmlText.replace(/`(.*?)`/g, '<code>$1</code>');
    return htmlText;
}

export function escapeHTML(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function telegramFooter(): string {
    return `<i>Powered by:</i> <a href="https://github.com/yyxff/Trend-Taste">Trend Taste</a>`
}
