import axiosClient from "./axiosClient";

const palletsApi = {
    getTypeOfWood: () => {
        const url = `/typeofwood`;
        return axiosClient().get(url, {});
    },
    getDryingMethod: () => {
        const url = `/items`;
        return axiosClient().get(url, {});
    },
    getDryingReason: () => {
        const url = `/reasons`;
        return axiosClient().get(url, {});
    },
    getStockByItem: (item, reason) => {
        const url = `/stock/${item}`;
        return axiosClient().get(url, {
            params: {
                reason: reason || "SL",
            },
        });
    },
    getKiln: () => {
        const url = `ovens/`;
        return axiosClient().get(url, {});
    },
    getThickness: (reason) => {
        const url = `/dryingmethod`;
        return axiosClient().get(url, {
            params: {
                reason: reason || "INDOOR"
            },
        });
    },
    getPlanDryingReason: () => {
        const url = `/oven-reasons`;
        return axiosClient().get(url, {});
    },
    
};

export default palletsApi;
