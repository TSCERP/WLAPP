import axiosClient from "./axiosClient";

const productionApi = {
    getFinishedGoodsList: (params) => {
        const queryStringParams = Object.keys(params)
            .map(
                (key) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        params[key]
                    )}`
            )
            .join("&");

        const url = `/production/receipts-productions?${queryStringParams}`;
        return axiosClient().get(url);
    },
    getFinishedGoodsListByGroup: (params) => {
        const queryStringParams = Object.keys(params)
            .map(
                (key) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        params[key]
                    )}`
            )
            .join("&");

        const url = `/production/receipts-productions?${queryStringParams}`;
        return axiosClient().get(url);
    },
    getFinishedPlywoodGoodsList: (params) => {
        const queryStringParams = Object.keys(params)
            .map(
                (key) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        params[key]
                    )}`
            )
            .join("&");

        const url = `/production/receipts-productions-vcn?${queryStringParams}`;
        return axiosClient().get(url);
    },
    getFinishedGoodsDetail: (params) => {
        const queryStringParams = Object.keys(params)
            .map(
                (key) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        params[key]
                    )}`
            )
            .join("&");

        const url = `/production/receipts-productions-detail?${queryStringParams}`;
        return axiosClient().get(url);
    },
    getFinishedPlywoodGoodsDetail: (params) => {
        const queryStringParams = Object.keys(params)
            .map(
                (key) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        params[key]
                    )}`
            )
            .join("&");

        const url = `/production/receipts-detail-vcn?${queryStringParams}`;
        return axiosClient().get(url);
    },
    enterFinishedGoodsAmountCBG: (data) => {
        const url = `/production/receipts-production`;
        return axiosClient().post(url, data);
    },
    enterFinishedGoodsAmountVCN: (data) => {
        const url = `/production/receipts-production`;
        return axiosClient().post(url, data);
    },
    deleteReceiptCBG: (payload) => {
        console.log("Đói quá: ", payload);
        const url = `/production/remove-receipt`;
        return axiosClient().delete(url, { data: payload });
    },
    rejectReceiptsCBG: (data) => {
        const url = `/production/reject-receipts`;
        return axiosClient().post(url, data);
    },
    rejectReceiptsVCN: (data) => {
        const url = `/production/reject-receipts`;
        return axiosClient().post(url, data);
    },
    acceptReceiptsCBG: (data) => {
        const url = `/production/accept-receipts`;
        return axiosClient().post(url, data);
    },
    acceptReceiptsVCN: (data) => {
        const url = `/production/accept-receipts-vcn`;
        return axiosClient().post(url, data);
    },
    getErrorTypes: () => {
        const url = `/loailoi`;
        return axiosClient().get(url);
    },
    // Type: ["CBG", "VCN"]
    getSolutions: (type) => {
        const url = `/huongxuly?type=${type}`;
        return axiosClient().get(url);
    },
    getGroup: () => {
        const url = `/danhsachto`;
        return axiosClient().get(url);
    },
    getAllGroupWithoutQC: () => {
        const url = `/getlist-team-exclude-qc`;
        return axiosClient().get(url);
    },
    getTeamBacks: () =>
    {
        const url =`/production/allteam`
        return axiosClient().get(url);
    },
    getRootCauses: () =>
    {
        const url =`/production/rootCause`
        return axiosClient().get(url);
    },
    getReturnCode: () =>
    {
        const url =`/items-route`
        return axiosClient().get(url);
    }
};

export default productionApi;
