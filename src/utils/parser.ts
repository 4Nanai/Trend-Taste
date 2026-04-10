export function parseMarkdownToHTML(text: string): string {
    let htmlText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    htmlText = htmlText.replace(/^- /gm, '• ');
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<i>$1</i>');
    htmlText = htmlText.replace(/`(.*?)`/g, '<code>$1</code>');
    return htmlText;
}
