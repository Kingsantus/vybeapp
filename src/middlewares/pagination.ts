export function paginateHolders(holders: any[], page: number): string {
    const pageSize = 20;
    const start = page * pageSize;
    const end = start + pageSize;
    const currentPage = holders.slice(start, end);

    if (currentPage.length === 0) return "🚫 No more results.";

    let message = `📦 *Top Token Holders (Page ${page + 1})*\n\n`;
    currentPage.forEach(holder => {
        message += `🏅 *Rank ${holder.rank}*\n`;
        message += `🔹 Token: ${holder.tokenSymbol}\n`;
        message += `💼 Address: \`${holder.ownerAddress}\`\n`;
        message += `💰 Balance: ${Number(holder.balance).toLocaleString()}\n`;
        message += `💵 USD: $${Number(holder.valueUsd).toLocaleString()}\n`;
        message += `📊 Supply %: ${holder.percentageOfSupplyHeld.toFixed(4)}%\n\n`;
    });
    console.log(currentPage)

    message += `⬅️ Type *prev* or *next* to navigate.`;
    return message;
}
