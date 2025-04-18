const apiKey = process.env.VYBE_API_KEY;

if (!apiKey) {
    throw new Error("VYBE_API_KEY is not defined in the environment variables.");
}

const getTokenHolders = async (token: string) => {
    try {
        const response = await fetch(`https://api.vybenetwork.xyz/token/${token}/top-holders`, {
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
        return data;
        // const {
        //     rank,
        //     ownerAddress,
        //     ownerName,
        //     ownerLogoUrl,
        //     tokenMint,
        //     tokenSymbol,
        //     tokenLogoUrl,
        //     balance,
        //     valueUsd,
        //     percentageOfSupplyHeld
        // } = data;

        // // You can now return or log just these
        // const result = {
        //     rank,
        //     ownerAddress,
        //     ownerName,
        //     ownerLogoUrl,
        //     tokenMint,
        //     tokenSymbol,
        //     balance,
        //     valueUsd,
        //     percentageOfSupplyHeld
        // };

        // console.log(result);
        // return result;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        throw error;
    }
};


export default getTokenHolders;
