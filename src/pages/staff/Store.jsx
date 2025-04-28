import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Card, message, Input } from "antd";
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
  const [receiptCount, setReceiptCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(data.products || []);
      if (!silent) messageApi.success("Products loaded");
    } catch (error) {
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
    if (updatedCart[index].quantity > 1) {
      updatedCart[index].quantity -= 1;
    }
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
      setReceiptCount(data.receipt.printCount);
      setReceiptId(data.receipt._id);
      setReceiptNumber(data.receipt.receiptCode);
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
    content: () => receiptRef.current,
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
        
        {/* Products Section */}
        <div className="lg:w-2/3 w-full">
          <div className="fixed top-15 z-20 bg-white p-3 rounded mb-4 min-w-3/6">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
              allowClear
              className="w-full"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-60 bg-white">
              <DotLoader />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 relative top-12 pb-20">
              {products
                .filter((product) =>
                  product.title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product, index) => {
                  const isOutOfStock = product.quantity === 0;
                  const price = product.isDiscount
                    ? product.unitPrice - product.discountAmount
                    : product.unitPrice;

                  return (
                    <Card
                      key={index}
                      hoverable
                      className={`p-1 ${isOutOfStock ? "opacity-50" : ""}`}
                      onClick={() => !isOutOfStock && handleProductClick(product)}
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
                  );
                })}

              {products.filter((product) =>
                product.title.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <p className="text-center col-span-full">No products found</p>
              )}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="lg:w-1/3 w-full">
          <div className="sticky top-4">
            <div className="bg-white p-4 rounded shadow-md">
              <h2 className="text-lg font-bold mb-4">Cart</h2>
              {cart.length === 0 ? (
                <p className="text-gray-500">Cart is empty</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                  {cart.map((item, index) => {
                    const price = item.isDiscount
                      ? item.unitPrice - item.discountAmount
                      : item.unitPrice;

                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b py-2"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={item.image || product_default}
                            alt={item.title}
                            className="w-10 h-10 object-contain"
                          />
                          <div>
                            <h4 className="text-sm font-semibold">{item.title}</h4>
                            <p className="text-xs text-gray-500">₦{price}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <div
                            className="bg-red-500 text-white p-1 rounded cursor-pointer"
                            onClick={() => handleMinusClick(index)}
                          >
                            <RiSubtractFill size={16} />
                          </div>
                          <span className="px-2">{item.quantity}</span>
                          <div
                            className="bg-blue-500 text-white p-1 rounded cursor-pointer"
                            onClick={() => handlePlusClick(index)}
                          >
                            <IoAdd size={16} />
                          </div>
                          <Button
                            type="text"
                            size="small"
                            danger
                            onClick={() => handleRemoveClick(index)}
                          >
                            <IoCloseOutline />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cart Total */}
              <div className="flex justify-between font-bold text-lg mt-4">
                <span>Total:</span>
                <span>₦{total}</span>
              </div>

              {/* Checkout */}
              <Button
                type="primary"
                className="w-full mt-4 bg-blue-600"
                onClick={logReceipt}
                disabled={cart.length === 0}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
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
            receiptCount={receiptCount}
          />
        )}
      </Modal>
    </div>
  );
};

export default Store;
