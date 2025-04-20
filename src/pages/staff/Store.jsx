import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Card, message } from "antd";
import { IoAdd, IoCloseOutline } from "react-icons/io5";
import { RiSubtractFill } from "react-icons/ri";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import Receipt from "../../components/receipt/Receipt";
import product_default from "../../assets/product-default.png";
import { useAuthConfig } from "../../context/AppState";
import DotLoader from "react-spinners/DotLoader";

const Store = () => {
  const [loading, setLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [receiptId, setReceiptId] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const { baseUrl, token } = useAuthConfig();
  const receiptRef = useRef();

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(data.products || []);
      if (!silent) messageApi.success("Products loaded");
    } catch {
      messageApi.error("Failed to fetch products.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      const interval = setInterval(() => fetchProducts(true), 20000);
      return () => clearInterval(interval);
    }
  }, [baseUrl, token]);

  const handleProductClick = (product) => {
    const index = cart.findIndex((item) => item._id === product._id);
    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart[index].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handlePlusClick = (index) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += 1;
    setCart(updatedCart);
  };

  const handleMinusClick = (index) => {
    const updatedCart = [...cart];
    if (updatedCart[index].quantity > 1) updatedCart[index].quantity -= 1;
    setCart(updatedCart);
  };

  const handleRemoveClick = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const logReceipt = async () => {
    setIsModalVisible(true);
    setReceiptLoading(true);

    try {
      const { data } = await axios.post(
        `${baseUrl}/preview`,
        {
          products: cart.map((item) => ({
            productId: item._id,
            quantitySold: item.quantity,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReceiptId(data.receipt._id);
      setReceiptNumber(data.receipt.receiptCode);
    } catch {
      messageApi.error("Failed to generate receipt.");
    } finally {
      setReceiptLoading(false);
    }
  };

  const total = cart.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onBeforePrint: async () => {
      setLoading(true);
      try {
        await axios.post(
          `${baseUrl}/sell-receipt`,
          { receiptId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        messageApi.success("Products sold!");
        await fetchProducts();
        await new Promise((res) => setTimeout(res, 200));
        return true;
      } catch (error) {
        messageApi.error("Sale failed. Printing canceled.");
        throw new Error("Print canceled.");
      } finally {
        setLoading(false);
      }
    },
    onAfterPrint: () => {
      setIsModalVisible(false);
      setCart([]);
    },
  });

  return (
    <div className="p-4">
      {contextHolder}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Products */}
        <div className="lg:w-2/3 w-full">
          {loading ? (
            <div className="flex justify-center items-center h-60 bg-white">
              <DotLoader />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((product, index) => {
                const isOut = product.quantity === 0;
                const price = product.isDiscount
                  ? product.unitPrice - product.discountAmount
                  : product.unitPrice;

                return (
                  <Card
                    key={index}
                    hoverable
                    onClick={() => !isOut && handleProductClick(product)}
                    className={`p-1 cursor-pointer ${
                      isOut ? "opacity-50" : ""
                    }`}
                    cover={
                      <img
                        alt={product.title}
                        src={product.image || product_default}
                        className="h-24 object-contain"
                      />
                    }
                  >
                    <h3 className="font-bold text-xs">{product.title}</h3>
                    <p className="text-xs">₦{price}</p>
                    <p
                      className={`text-xs ${
                        isOut
                          ? "text-red-500"
                          : product.quantity < 10
                          ? "text-orange-500"
                          : ""
                      }`}
                    >
                      Qty: {product.quantity}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="lg:w-1/3 w-full">
          <h2 className="text-lg font-bold mb-2">Cart</h2>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <div className="bg-white p-3 rounded shadow-md">
              <div className="max-h-96 overflow-y-auto">
                {cart.map((item, index) => {
                  const price = item.isDiscount
                    ? item.unitPrice - item.discountAmount
                    : item.unitPrice;

                  return (
                    <div
                      key={index}
                      className="border-b py-2 flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <img
                          src={item.image || product_default}
                          alt={item.title}
                          className="w-10 h-10 object-contain"
                        />
                        <div className="ml-2">
                          <h4 className="text-sm font-semibold">{item.title}</h4>
                          <p className="text-sm">₦{price}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="bg-red-600 text-white px-1 cursor-pointer"
                          onClick={() => handleMinusClick(index)}
                        >
                          <RiSubtractFill size={20}/>
                        </div>
                        <span className="px-2">{item.quantity}</span>
                        <div
                          className="bg-blue-600 text-white px-1 cursor-pointer"
                          onClick={() => handlePlusClick(index)}
                        >
                          <IoAdd size={20}/>
                        </div>
                        <Button
                          size="small"
                          danger
                          className="ml-2"
                          onClick={() => handleRemoveClick(index)}
                        >
                          <IoCloseOutline />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-4 font-bold">
                <span>Total:</span>
                <span>₦{total}</span>
              </div>
              <Button
                type="primary"
                className="w-full mt-4 bg-blue-600"
                onClick={logReceipt}
              >
                Checkout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Receipt */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            className="bg-blue-600"
            onClick={handlePrint}
            loading={loading}
          >
            Print Receipt
          </Button>,
        ]}
      >
        {receiptLoading ? (
          <div className="flex justify-center items-center h-60">
            <DotLoader />
          </div>
        ) : (
          <Receipt
            ref={receiptRef}
            cart={cart}
            total={total}
            receiptId={receiptId}
            receiptNumber={receiptNumber}
          />
        )}
      </Modal>
    </div>
  );
};

export default Store;
