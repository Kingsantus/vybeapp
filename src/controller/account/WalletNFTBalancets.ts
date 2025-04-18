import vybeApi from '@api/vybe-api';
const apiKey = process.env.VYBE_API_KEY;

if (!apiKey) {
    throw new Error("VYBE_API_KEY is not defined in the environment variables.");
}

vybeApi.auth(apiKey);

const getWalletsNFTBalance = async (wallet: string[], limit?: number, include?: boolean):Promise<any> => {
    try {
        const { data } = await vybeApi.post_wallet_nfts_many({
            includeNoPriceBalance: include ?? false,
            sortByAsc: 'amount',
            limit: limit ?? 100,
            page: 1,
            wallets: wallet ?? []
        });
        return data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export default getWalletsNFTBalance