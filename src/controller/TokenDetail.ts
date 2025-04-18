const apiKey = process.env.VYBE_API_KEY;

if (!apiKey) {
    throw new Error("VYBE_API_KEY is not defined in the environment variables.");
}

const getTokenDetails = async (token: string) => {
    try {
        const response = await fetch(`https://api.vybenetwork.xyz/token/${token}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            }
        });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const {
            name,
            symbol,
            price,
            verified,
            category,
            currentSupply,
            marketCap,
            tokenAmountVolume24h,
            usdValueVolume24h
        } = data;

        // You can now return or log just these
        const result = {
            name,
            symbol,
            price,
            verified,
            category,
            currentSupply,
            marketCap,
            tokenAmountVolume24h,
            usdValueVolume24h
        };

        // console.log(result);
        return result;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        throw error; // Optional: rethrow if you want the caller to handle it
    }
};


export default getTokenDetails;
