import React, { useState, useEffect } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import toast from "react-hot-toast";
import {
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
} from "@chakra-ui/react";
import useQuantityValidation from '../hook/useQuantityValidation';

function PalletCard(props) {
    const {
        itemCode,
        itemName,
        whsCode,
        inStock,
        batchNum,
        onDelete,
        width,
        height,
        thickness,
        onQuantityChange,
        // isInvalidQuantity
    } = props;

    // const [isQuantityExceedingStock, setIsQuantityExceedingStock] = useState(false);
    // const [isInvalidQuantity, setIsInvalidQuantity] = useState(false);
    // const [quantity, setQuantity] = useState(null);
    // const [isQuantityEmpty, setIsQuantityEmpty] = useState(false);

    // const handleQuantityChange = (value) => {
    //     var quantity = parseFloat(value);
    //     var inStock = parseFloat(props.inStock);

    //     if (quantity > inStock) {
    //         setIsInvalidQuantity(true);
    //     } else if (quantity === 0) {
    //         setIsInvalidQuantity(true);
    //     } else if (quantity == null || quantity == "") {
    //         setIsInvalidQuantity(true);
    //     } else {
    //         setIsInvalidQuantity(false);
    //     }

    //     props.onQuantityChange(value);
    // };

    
    // Check Invalid
    const [quantity, setQuantity] = useState(null);
    const [isInvalidQuantity, setIsInvalidQuantity] = useState(props.isInvalidQuantity);

    useEffect(() => {
        setIsInvalidQuantity(props.isInvalidQuantity);
    }, [props.isInvalidQuantity]);

    console.log("Giá trị Invalid Quantity ở PalletCard:", isInvalidQuantity);

    return (
        <div className="border-2 border-[#c6d3da] rounded-xl">
            <div className="flex items-center justify-between px-2 pr-4 bg-[#F6F8F9] rounded-t-xl ">
                <div className="text-[#17506B] xl:text-xl font-semibold text-lg px-4 py-3">
                    <span>{itemCode} - </span>
                    {itemName}
                </div>
                <div
                    className="text-[#17506B] text-3xl cursor-pointer"
                    onClick={onDelete}
                >
                    <AiFillCloseCircle />
                </div>
            </div>
            {/* <div className="xl:block md:block hidden text-xs pt-3 text-gray-500 px-4">
                Mã kho: {whsCode}
            </div> */}
            <div className=" pallet-line grid xl:grid-cols-2 md:grid-cols-2 grid-cols-2 gap-4 bg-white py-3 px-4 rounded-b-xl">
                <div className="hidden">
                    <label
                        htmlFor="company"
                        className="block mb-2 text-md font-medium text-gray-900 "
                    >
                        Mã kho
                    </label>
                    <input
                        type="text"
                        id="inStock"
                        className="bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        placeholder="0"
                        readOnly={true}
                        required
                        value={whsCode}
                    />
                </div>
                <div className="hidden">
                    <label
                        htmlFor="company"
                        className="block mb-2 text-md font-medium text-gray-900 "
                    >
                        Batch Num
                    </label>
                    <input
                        type="text"
                        id="batchNum"
                        className="bg-gray-100 border border-gray-300 text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        placeholder="0"
                        readOnly={true}
                        required
                        value={batchNum}
                    />
                </div>

                <div>
                    <label
                        htmlFor="company"
                        className="block mb-2 text-md font-medium text-gray-900 "
                    >
                        Tồn kho
                    </label>
                    <input
                        type="text"
                        id="inStock"
                        className="bg-gray-100 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        placeholder="0"
                        readOnly={true}
                        required
                        value={inStock}
                    />
                </div>

                <div>
                    <label
                        htmlFor="quantity"
                        className="block mb-2 text-md font-medium text-gray-900 "
                    >
                        Số lượng
                    </label>
                    <NumberInput
                        defaultValue={0}
                        isInvalid={isInvalidQuantity}
                        // onChange={onQuantityChange}
                        onChange={(value) => {
                            setQuantity(value);
                            onQuantityChange(value);
                        }}
                    >
                        <NumberInputField/>
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                </div>

                <div className="hidden">
                    <label
                        htmlFor="company"
                        className="block mb-2 text-md font-medium text-gray-900 "
                    >
                        Chiều rộng
                    </label>
                    <input
                        type="hidden"
                        id="width"
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        placeholder="0"
                        required
                        value={width}
                    />
                </div>
                <div className="hidden">
                    <label
                        htmlFor="company"
                        className="block mb-2 text-md font-medium text-gray-900 "
                    >
                        Chiều dài
                    </label>
                    <input
                        type="hidden"
                        id="height"
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        placeholder="0"
                        required
                        value={height}
                    />
                </div>
                <div className="hidden">
                    <label
                        htmlFor="company"
                        className="block mb-2 text-md font-medium text-gray-900 "
                    >
                        Chiều dày
                    </label>
                    <input
                        type="hidden"
                        id="thickness"
                        className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        placeholder="0"
                        required
                        value={thickness}
                    />
                </div>
            </div>
        </div>
    );
}

export default PalletCard;
