import express from "express";
import bot from "./utils/telegrafConf";
import { Context } from "telegraf";
import getTokenDetails from "./controller/TokenDetail";
import getTokenHolders from "./controller/TokenHolder";
import { paginateHolders } from "./middlewares/pagination";
import getAccountDetails from "./controller/AccountBalance";
import vybeApi from '@api/vybe-api';
import getWalletTokenTransactions from "./controller/account/WalletTokenTransactions";
import getWalletProfitAndLoss from "./controller/account/WalletProfitAndLoss";
import getDexAmm from "./controller/price/DEXAMM";
import getMarkets from "./controller/price/GetMarkets";


const app = express();

enum range {
    M = '30d',
    W = '7d',
    D = '1d'
}


// const userPaginationState = new Map<number, { token: string, holders: any[], page: number }>();

bot.start((ctx: Context) => {
    const userName = ctx.message?.from?.first_name || "User";
    const userId = ctx.message?.from?.id;
    ctx.reply(`Hello ${userName}, welcome!`);
    ctx.reply(
        "This bot is designed to help you with your trading. Type /help to see what I can do."
    );
});

bot.help((ctx: Context) => {
    ctx.reply(
        "Here are the commands you can use:\n" +
            "/start - Start the bot\n" +
            "/help - List available commands\n" +
            "/tokendetail [tokenAddress] - Get details about a specific token\n" +
            "/accountdetail [walletAddress] - Get account details for your wallet Address\n" +
            "/walletstxs [any number of wallet address] day in figure eg. 2 - Get the transactions performed in the wallet address in the last specified days\n" +
            "/walletpnl walletaddr token=tokenaddress limit=1-1000 days=(d, m, w) - Get the profit and loss from a wallet transactions tokenaddress for the specific token alone and limit is amount of data to return and days is range\n" +
            "/trade - Get trading tips\n" +
            "/news - Get the latest news\n"
    );
});

bot.command("accountdetail", async (ctx) => {
    const message = ctx.message?.text;
    const token = message?.split(" ")[1];
    if (!token) {
        ctx.reply("Please provide a token ID.");
        return;
    }
    try {
        const accountDetail = await getAccountDetails(token);
        if (!accountDetail) {
            ctx.reply("No account details found for this token.");
            return;
        }

        // Construct the message with token details
        const tokenDetails = accountDetail.tokens.map((token : {
            symbol: string;
            name: string;
            amount: number;
            priceUsd: number;
            verified: boolean;
            category: string;
            valueUsd: number;
        }) => {
            return `🔹 Token: ${token.symbol} (${token.name})\n` +
                `💼 Amount: ${Number(token.amount).toLocaleString()}\n` +
                `💰 Price (USD): $${Number(token.priceUsd).toLocaleString()}\n` +
                `📊 Value (USD): $${Number(token.valueUsd).toLocaleString()}\n` +
                `🔍 Category: ${token.category}\n` +
                `🔍 Verified: ${token.verified ? '✅ Yes' : '❌ No'}\n\n`;
        }).join("");

        ctx.reply(
            `📊 Token Details:\n` +
            `Address: ${accountDetail.ownerAddress}\n` +
            `Total Token Count: ${accountDetail.totalTokenCount.toLocaleString()}\n` +
            `Total Token Value in Usd: $${accountDetail.totalTokenValueUsd.toLocaleString()}\n` +
            "🔍 Tokens:\n" +
            `${tokenDetails}`
        );
    }
    catch (error) {
        ctx.reply("There was an error fetching the token details.");
    }
});

bot.command("tokendetail", async (ctx) => {
    const message = ctx.message?.text;
    const token = message?.split(" ")[1];
    if (!token) {
        ctx.reply("Please provide a token ID.");
        return;
    }
    try {
        const tokenDetails = await getTokenDetails(token);
        ctx.reply(
            `📊 Token Details:\n` +
            `Name: ${tokenDetails.name}\n` +
            `Symbol: ${tokenDetails.symbol}\n` +
            `Price: $${tokenDetails.price.toFixed(2)}\n` +
            `Verified: ${tokenDetails.verified ? '✅ Yes' : '❌ No'}\n` +
            `Category: ${tokenDetails.category}\n` +
            `Current Supply: ${tokenDetails.currentSupply.toLocaleString()}\n` +
            `Market Cap: $${tokenDetails.marketCap.toLocaleString()}\n` +
            `Token Volume (24h): ${tokenDetails.tokenAmountVolume24h.toLocaleString()}\n` +
            `USD Volume (24h): $${tokenDetails.usdValueVolume24h.toLocaleString()}`
        );
    }
    catch (error) {
        ctx.reply("There was an error fetching the token details.");
    }
});

bot.command("tokenholders", async (ctx) => {
    const message = ctx.message?.text;
    const token = message?.split(" ")[1];
    if (!token) {
        ctx.reply("Please provide a token ID.");
        return;
    }
    try {
        const holders = await getTokenHolders(token);

        if (holders.length === 0) {
            ctx.reply("No holders found for this token.");
            return;
        }

        let replyMessage = "Token Holders:\n\n";

        holders.forEach((holder: { rank: number; tokenSymbol: string; ownerAddress: string; balance: number; valueUsd: number; percentageOfSupplyHeld: number }, index: number) => {
            replyMessage +=
                `🏅 *Rank ${holder.rank}*\n` +
                `🔹 Token: ${holder.tokenSymbol}\n` +
                `💼 Address: \`${holder.ownerAddress}\`\n` +
                `💰 Balance: ${Number(holder.balance).toLocaleString()}\n` +
                `💵 USD: $${Number(holder.valueUsd).toLocaleString()}\n` +
                `📊 Supply %: ${holder.percentageOfSupplyHeld.toFixed(4)}%\n\n`;

            // Check if the message is getting too long
            if (replyMessage.length > 4000) {
                ctx.reply(replyMessage, { parse_mode: "Markdown" });
                replyMessage = ""; // Reset the message for the next batch
            }
        });

        // Send any remaining part of the message
        if (replyMessage) {
            ctx.reply(replyMessage, { parse_mode: "Markdown" });
        }
        return;
    } catch (error) {
        ctx.reply("There was an error fetching the token details.");
    }
});

// Account check
bot.command("walletstxs", async (ctx) => {
    const message = ctx.message?.text;
    if (!message) return ctx.reply("Invalid message.");
    // remove the /command
    const args = message.split(" ").slice(1);
    
    // Initialize variables
    let day: number | undefined;
    const wallets: string[] = [];

    // Process arguments to separate wallets and day
    args.forEach(arg => {
        const num = Number(arg);
        if (!isNaN(num)) {
        day = num; // Set as day if it's a number
        } else {
        wallets.push(arg); // Otherwise, treat as a wallet address
        }
    });

    if (wallets.length === 0) {
        return ctx.reply("Please provide at least one valid wallet address.");
    }

    try {
        const result = await getWalletTokenTransactions(day, wallets);

        if (!result || !result.data || result.data.length === 0) {
            return ctx.reply("No transaction data found.");
        }

        let replyMessage = "Transaction Details:\n\n";

        result.ownerAddresses.forEach((address: string, index: number) => {
            replyMessage += `💼 *Owner Address ${index + 1}*: \`${address}\`\n\n`;
        });

        result.data.forEach((transaction: any, index: number) => {
            const blockTime = new Date(transaction.blockTime * 1000).toLocaleString();
            replyMessage +=
                `🕒 *Transaction ${index + 1}*\n` +
                `📅 Block Time: ${blockTime}\n` +
                `💸 Token Value: ${transaction.tokenValue}\n` +
                `🔒 Stake Value: ${transaction.stakeValue}\n` +
                `🔧 System Value: ${transaction.systemValue}\n` +
                `🔒 Stake Value (SOL): ${transaction.stakeValueSol}\n\n`;

            // Check if the message is getting too long
            if (replyMessage.length > 4000) {
                ctx.reply(replyMessage, { parse_mode: "Markdown" });
                replyMessage = ""; // Reset the message for the next batch
            }
        });

        // Send any remaining part of the message
        if (replyMessage) {
            ctx.reply(replyMessage, { parse_mode: "Markdown" });
        }
        return;
    } catch (error) {
        ctx.reply("🚫 Failed to fetch wallet transactions.");
    }
})

bot.command("walletpnl", async (ctx) => {
    const message = ctx.message?.text;
    if (!message) return ctx.reply("Invalid message.");
    // remove the /command
    const args = message.split(" ").slice(1);
     if (args.length === 0) {
        return ctx.reply("Please provide a wallet address.");
    }

    const wallet = args[0];
    let token: string | undefined;
    let limit: number | undefined;
    let resolution: range | undefined;

    // Parse optional arguments
    let i = 1;
    while (i < args.length) {
        if (args[i].startsWith("token=")) {
            token = args[i].split("=")[1];
        } else if (args[i].startsWith("limit=")) {
            limit = parseInt(args[i].split("=")[1], 10);
        } else if (args[i].startsWith("days=")) {
            const res = args[i].split("=")[1].toUpperCase();
            if (res in range) {
                resolution = range[res as keyof typeof range];
            } else {
                return ctx.reply("Invalid resolution. Use M, W, or D.");
            }
        } else {
            return ctx.reply("Invalid argument format. Use 'token=<token>', 'limit=<number>', 'resolution=<M|W|D>'.");
        }
        i++;
    }

    try {
        const result = await getWalletProfitAndLoss(wallet, token, limit, resolution);
         if (!result || !result.summary) {
            return ctx.reply("No profit and loss data found.");
        }

        const {
            winRate,
            realizedPnlUsd,
            unrealizedPnlUsd,
            uniqueTokensTraded,
            averageTradeUsd,
            tradesCount,
            winningTradesCount,
            losingTradesCount,
            tradesVolumeUsd,
            bestPerformingToken,
            worstPerformingToken,
            pnlTrendSevenDays
        } = result.summary;

        let replyMessage = "Wallet Profit and Loss Summary:\n\n";
        replyMessage += `🏆 Win Rate: ${winRate}%\n`;
        replyMessage += `💰 Realized PnL (USD): $${realizedPnlUsd.toFixed(2)}\n`;
        replyMessage += `💸 Unrealized PnL (USD): $${unrealizedPnlUsd.toFixed(2)}\n`;
        replyMessage += `🔄 Unique Tokens Traded: ${uniqueTokensTraded}\n`;
        replyMessage += `💵 Average Trade (USD): $${averageTradeUsd.toFixed(2)}\n`;
        replyMessage += `📊 Trades Count: ${tradesCount}\n`;
        replyMessage += `✅ Winning Trades: ${winningTradesCount}\n`;
        replyMessage += `❌ Losing Trades: ${losingTradesCount}\n`;
        replyMessage += `📈 Trades Volume (USD): $${tradesVolumeUsd.toFixed(2)}\n`;

        if (bestPerformingToken) {
            replyMessage += `🏅 Best Performing Token: ${bestPerformingToken}\n`;
        }

        if (worstPerformingToken) {
            replyMessage += `🏅 Worst Performing Token: ${worstPerformingToken}\n`;
        }

        if (pnlTrendSevenDays.length > 0) {
            replyMessage += `\n📅 PnL Trend (Last 7 Days):\n`;
            pnlTrendSevenDays.forEach((pnl: number, index: number) => {
                replyMessage += `Day ${index + 1}: $${pnl.toFixed(2)}\n`;
            });
        }

        // Send the reply message
        ctx.reply(replyMessage, { parse_mode: "Markdown" });
    } catch (error) {
        ctx.reply("🚫 Failed to fetch wallet transactions.");
    }
})

// bot.on("text", async (ctx) => {
//     const input = ctx.message.text.toLowerCase();
//     const userId = ctx.from.id;
//     const state = userPaginationState.get(userId);

//     if (!state || (input !== "next" && input !== "prev")) return;

//     if (input === "next") state.page++;
//     else if (input === "prev" && state.page > 0) state.page--;

//     const message = paginateHolders(state.holders, state.page);
//     ctx.reply(message, { parse_mode: "Markdown" });
// });

// Prices
bot.command("getdexandamm", async (ctx) => {
    try {
        const results = await getDexAmm();
        if (!results || !results.data || results.data.length === 0) {
            return ctx.reply("Error while fetching data or no data found.");
        }

        let replyMessage = "DEX and AMM Programs:\n\n";

        results.data.forEach((result: { programId: string; programName: string }, index: number) => {
            replyMessage +=
                `🔹 *Program ${index + 1}*\n` +
                `🆔 Program ID: \`${result.programId}\`\n` +
                `🏷️ Program Name: ${result.programName}\n\n`;

            // Check if the message is getting too long
            if (replyMessage.length > 4000) {
                ctx.reply(replyMessage, { parse_mode: "Markdown" });
                replyMessage = ""; // Reset the message for the next batch
            }
        });

        // Send any remaining part of the message
        if (replyMessage) {
            ctx.reply(replyMessage, { parse_mode: "Markdown" });
        }

    } catch (error) {
        ctx.reply("🚫 Failed to fetch DEX and AMM data.");
    }
});

bot.command("getmarkets", async (ctx) => {
    const message = ctx.message?.text;
    if (!message) return ctx.reply("Invalid message.");

    // Remove the /command and split the arguments
    const args = message.split(" ").slice(1);
    if (args.length === 0) {
        return ctx.reply("Please provide a wallet address.");
    }

    const wallet = args[0];
    try {
        const markets = await getMarkets(wallet);
        console.log(markets);
        if (!markets || !markets.data || markets.data.length === 0) {
            return ctx.reply("No market data found.");
        }

        let replyMessage = "Markets Data:\n\n";

        markets.data.forEach((market: { marketId: string; marketName: string; programId: string; programName: string; baseTokenSymbol: string; quoteTokenSymbol: string; baseTokenMint: string; quoteTokenMint: string; baseTokenName: string; quoteTokenName: string; updatedAt: number }, index: number) => {
            const updatedAt = new Date(market.updatedAt * 1000).toLocaleString();
            replyMessage +=
                `🔹 *Market ${index + 1}*\n` +
                `🆔 Market ID: \`${market.marketId}\`\n` +
                `🏷️ Market Name: ${market.marketName}\n` +
                `🔧 Program ID: \`${market.programId}\`\n` +
                `🏷️ Program Name: ${market.programName}\n`;

            // Dynamically include all tokens
            if (market.baseTokenSymbol && market.baseTokenMint && market.baseTokenName) {
                replyMessage +=
                    `🔄 Base Token Symbol: ${market.baseTokenSymbol}\n` +
                    `🔑 Base Token Mint: \`${market.baseTokenMint}\`\n` +
                    `🏷️ Base Token Name: ${market.baseTokenName}\n`;
            }

            if (market.quoteTokenSymbol && market.quoteTokenMint && market.quoteTokenName) {
                replyMessage +=
                    `🔄 Quote Token Symbol: ${market.quoteTokenSymbol}\n` +
                    `🔑 Quote Token Mint: \`${market.quoteTokenMint}\`\n` +
                    `🏷️ Quote Token Name: ${market.quoteTokenName}\n`;
            }

            replyMessage += `🕒 Updated At: ${updatedAt}\n\n`;

            // Check if the message is getting too long
            if (replyMessage.length > 4000) {
                ctx.reply(replyMessage, { parse_mode: "Markdown" });
                replyMessage = ""; // Reset the message for the next batch
            }
        });

        // Send any remaining part of the message
        if (replyMessage) {
            ctx.reply(replyMessage, { parse_mode: "Markdown" });
        }

    } catch (error) {
        ctx.reply("🚫 Failed to fetch market data.");
    }
});



bot.launch();

export default app;