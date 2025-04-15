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
  const [messageApi, contextHolder] = message.useMessage();
  const { baseUrl, token } = useAuthConfig();
  const [products, setProducts] = useState([]);
  const [receiptId, setReceiptId] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  const receiptRef = useRef();

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.products || []);
      if (!silent) messageApi.success("Products loaded successfully.");
    } catch (error) {
      messageApi.error("Failed to fetch products.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      const intervalId = setInterval(() => fetchProducts(true), 20000);
      return () => clearInterval(intervalId);
    }
  }, [baseUrl, token]);

  const handleProductClick = (product) => {
    const index = cart.findIndex((item) => item._id === product._id);
    if (index !== -1) {
      const updatedCart = cart.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handlePlusClick = (index) => {
    const updatedCart = cart.map((item, i) =>
      i === index ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCart(updatedCart);
  };

  const handleMinusClick = (index) => {
    const updatedCart = cart.map((item, i) =>
      i === index && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    setCart(updatedCart);
  };

  const handleRemoveClick = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const logReceipt = async () => {
    setIsModalVisible(true);
    setReceiptLoading(true);
  
    const sellPayload = {
      products: cart.map((item) => ({
        productId: item._id,
        quantitySold: item.quantity,
      })),
    };
  
    try {
      const response = await axios.post(`${baseUrl}/preview`, sellPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const { _id, receiptCode } = response.data.receipt;
      setReceiptId(_id);
      setReceiptNumber(receiptCode);
      console.log(test);
    } catch (error) {
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
        // Sending receiptId in the body of the POST request.
        const response = await axios.post(
          `${baseUrl}/sell-receipt`, 
          { receiptId }, // Make sure to wrap `receiptId` in an object
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        messageApi.success("Products sold successfully!");
  
        // Fetch the products after the sale
        await fetchProducts();
  
        // Optional: Adding a delay to ensure the product fetch and API call have completed.
        await new Promise((resolve) => setTimeout(resolve, 200));
        
        // Returning a promise here ensures the printing only happens after these operations.
        return true;
      } catch (error) {
        messageApi.error("Sale failed. Printing canceled.");
        console.error(error);
        throw new Error("Print canceled.");
      } finally {
        setLoading(false);
      }
    },
    onAfterPrint: () => {
      // Reset modal visibility and cart after printing.
      setIsModalVisible(false);
      setCart([]); // Clear cart items
    },
  });
  

  return (
    <div>
      {contextHolder}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-2">
          {loading ? (
            <div className="flex justify-center items-center h-60 bg-white">
              <DotLoader />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product, index) => {
                const isOutOfStock = product.quantity === 0;
                const finalPrice = product.isDiscount
                  ? product.unitPrice - product.discountAmount
                  : product.unitPrice;

                return (
                  <div
                    key={index}
                    onClick={() => !isOutOfStock && handleProductClick(product)}
                  >
                    <Card
                      hoverable
                      className={`p-1 ${isOutOfStock ? "opacity-50" : ""}`}
                      cover={
                        <img
                          alt={product.title}
                          src={product.image || product_default}
                          style={{ height: 90, objectFit: "contain" }}
                        />
                      }
                    >
                      <h3 className="font-bold text-xs">{product.title}</h3>
                      <p className="text-xs">₦{product.unitPrice}</p>
                      <p
                        className={`text-xs ${
                          isOutOfStock
                            ? "text-red-500"
                            : product.quantity < 10
                            ? "text-orange-500"
                            : ""
                        }`}
                      >
                        Qty: {product.quantity}
                      </p>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 p-4 lg:fixed right-4 w-full lg:w-1/4 top-24">
          <h2 className="text-xl font-bold">Cart</h2>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <div className="cart-container overflow-y-auto h-96">
              {cart.map((item, index) => {
                const finalPrice = item.isDiscount
                  ? item.unitPrice - item.discountAmount
                  : item.unitPrice;

                return (
                  <div
                    key={index}
                    className="p-2 border-b flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <img
                        src={item.image || product_default}
                        alt={item.title}
                        style={{ width: 40, height: 40 }}
                      />
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold">{item.title}</h4>
                        <p className="text-sm">₦{finalPrice}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div
                        className="bg-red-800 text-white px-1 cursor-pointer"
                        onClick={() => handleMinusClick(index)}
                      >
                        <RiSubtractFill />
                      </div>
                      <span className="px-2">{item.quantity}</span>
                      <div
                        className="bg-blue-800 text-white px-1 cursor-pointer"
                        onClick={() => handlePlusClick(index)}
                      >
                        <IoAdd />
                      </div>
                      <Button
                        danger
                        size="small"
                        className="ml-2"
                        onClick={() => handleRemoveClick(index)}
                      >
                        <IoCloseOutline />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
