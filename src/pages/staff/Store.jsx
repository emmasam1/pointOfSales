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
  const [cart, setCart] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { baseUrl, token } = useAuthConfig();
  const [products, setProducts] = useState([]);

  const receiptRef = useRef();

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    const getProductsUrl = `${baseUrl}/products`;
    try {
      const response = await axios.get(getProductsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(response.data.products);
      // console.log(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Failed to fetch products",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [baseUrl, token]);

  // Handle adding products to cart
  const handleProductClick = (product) => {
    const existingProductIndex = cart.findIndex(
      (item) => item._id === product._id
    );
    if (existingProductIndex !== -1) {
      const updatedCart = cart.map((item, index) => {
        if (index === existingProductIndex) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Handle plus/minus and remove for cart items
  const handlePlusClick = (index) => {
    const updatedCart = cart.map((item, idx) => {
      if (idx === index) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const handleMinusClick = (index) => {
    const updatedCart = cart.map((item, idx) => {
      if (idx === index && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const handleRemoveClick = (index) => {
    const updatedCart = cart.filter((_, idx) => idx !== index);
    setCart(updatedCart);
  };

  const logReceipt = () => {
    setIsModalVisible(true);
  };

  // const handlePrint = useReactToPrint({
  //   contentRef: receiptRef,
  //   onBeforePrint: () => {
  //     return new Promise((resolve) => {
  //       setTimeout(resolve, 200);
  //     });
  //   },
  //   onAfterPrint: () => {
  //     console.log("Printing finished!");
  //     setIsModalVisible(false);
  //   },
  // });

  const total = cart.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onBeforePrint: async () => {
      const sellPayload = {
        products: cart.map((item) => ({
          productId: item._id,
          quantitySold: item.quantity,
        })),
      };

      // console.log("Sending sale data:", sellPayload);
      setLoading(true);
      try {
        await axios.post(`${baseUrl}/sell`, sellPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // console.log("Products sold successfully!");
        messageApi.success("Products sold successfully!");

        await fetchProducts();

        return new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(
          "Failed to sell products:",
          error.response?.data || error
        );
        messageApi.error(
          error.response?.data?.message || "Sale failed. Printing canceled."
        );
        throw new Error("Sale failed, canceling print.");
      } finally {
        setLoading(false);
      }
    },
    onAfterPrint: () => {
      // console.log("Printing finished!");
      setIsModalVisible(false);
      setCart([]);
    },
  });

  return (
    <div className="">
      {contextHolder}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
        {/* Product List */}
        <div className="lg:col-span-2 p-2">
          {loading ? (
            <div className="flex justify-center items-center my-4 h-60 bg-white">
              <DotLoader />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative top-10">
              {products.map((product, index) => {
                const finalPrice =
                  Number(
                    product.isDiscount
                      ? product.unitPrice - product.discountAmount
                      : product.unitPrice
                  ) || 0;

                const isOutOfStock = product.quantity === 0;

                return (
                  <div
                    key={index}
                    className=""
                    onClick={() => !isOutOfStock && handleProductClick(product)} // Only allow click if not out of stock
                  >
                    <Card
                      hoverable
                      style={{ width: "100%", height: 220 }}
                      className={`p-1 relative ${
                        isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      cover={
                        <img
                          alt={product.title}
                          src={product.image || product_default}
                          style={{
                            width: "100%",
                            height: 90,
                            objectFit: "contain",
                          }}
                        />
                      }
                    >
                      <div>
                        <h3 className="font-bold m-0 text-xs mb-2">
                          {product.title}
                        </h3>
                        <p className="font-semibold text-xs mb-1">{`Price: ₦${product.unitPrice}`}</p>
                        <p
                          className={`font-medium ${
                            isOutOfStock
                              ? "text-red-500"
                              : product.quantity < 10
                              ? "text-orange-500"
                              : "text-gray-800"
                          }`}
                        >
                          Quantity: {product.quantity}
                          {isOutOfStock ? (
                            <span className="ml-2 text-sm italic">
                              (Out of stock!)
                            </span>
                          ) : product.quantity < 10 ? (
                            <span className="ml-2 text-sm italic">
                              (Low stock!)
                            </span>
                          ) : null}
                        </p>

                        {product.discountAmount != 0 ? (
                          <p className="absolute text-red-500 text-xs bg-red-100 p-2 top-1 right-1">{`-₦${product.discountAmount}`}</p>
                        ) : (
                          ""
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1 p-4 lg:fixed right-4 w-full lg:w-1/4 top-24">
          <h2 className="text-xl font-bold">Cart</h2>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <div className="cart-container overflow-y-auto h-96">
              {cart.map((item, index) => {
                const finalPrice =
                  Number(
                    item.isDiscount
                      ? item.unitPrice - item.discountAmount
                      : item.unitPrice
                  ) || 0;

                return (
                  <div
                    key={index}
                    className="p-2 border-b border-gray flex items-center relative justify-between"
                  >
                    <div className="flex">
                      <img
                        alt={item.title}
                        src={item.image || product_default}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "contain",
                        }}
                      />
                      <div className="ml-4">
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        <p className="text-sm">{`₦ ${finalPrice}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className="text-white bg-red-800 cursor-pointer"
                          onClick={() => handleMinusClick(index)}
                        >
                          <RiSubtractFill />
                        </div>
                        <div>{item.quantity}</div>
                        <div
                          className="text-white bg-blue-800 cursor-pointer"
                          onClick={() => handlePlusClick(index)}
                        >
                          <IoAdd />
                        </div>
                      </div>
                      <Button
                        type="danger"
                        className="ml-4"
                        onClick={() => handleRemoveClick(index)}
                      >
                        <IoCloseOutline />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between font-bold mt-4">
                <span>Total:</span>
                <span>{`₦ ${total}`}</span>
              </div>
              <Button
                type="primary"
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
                onClick={logReceipt}
              >
                Check out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
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
            className="bg-blue-700"
            onClick={handlePrint}
          >
            {loading ? "Printing..." : "Print Receipt"}
          </Button>,
        ]}
      >
        <Receipt ref={receiptRef} cart={cart} total={total} />
      </Modal>
    </div>
  );
};

export default Store;
