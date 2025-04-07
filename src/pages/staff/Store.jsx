import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Modal, message } from "antd";
import { useReactToPrint } from "react-to-print";
import Receipt from "../../components/receipt/Receipt";
import product_default from "../../assets/product-default.png";
import { IoCloseOutline, IoAdd } from "react-icons/io5";
import { RiSubtractFill } from "react-icons/ri";
import { useAuthConfig } from "../../context/AppState";
import axios from "axios";

const Store = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const receiptRef = useRef(null); // Correctly initialize the ref
  const { baseUrl, token } = useAuthConfig();
  const [products, setProducts] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false); // Track print status
  const promiseResolveRef = useRef(null); // Ref to store the promise resolver

  // Fetch products from API
  const fetchProducts = async () => {
    const getProductsUrl = `${baseUrl}/products`;
    try {
      const response = await axios.get(getProductsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Failed to fetch products",
      });
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts(); // Only fetch when the token is available
    }
  }, [baseUrl, token]);

  // Ensure valid numbers for the total calculation
  const total = cart.reduce((acc, curr) => {
    const unitPrice = Number(curr.unitPrice) || 0; // Convert price to number
    const quantity = Number(curr.quantity) || 0; // Convert quantity to number
    return acc + unitPrice * quantity;
  }, 0);

  // Handle adding products to cart
  const handleProductClick = (product) => {
    const existingProductIndex = cart.findIndex((item) => item._id === product._id);
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

  // Set up the printing functionality
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current, // Pass the correct ref to `content`
    onBeforePrint: () => {
      return new Promise((resolve) => {
        promiseResolveRef.current = resolve; // Store the resolve function
        setIsPrinting(true); // Mark as printing
      });
    },
    onAfterPrint: () => {
      promiseResolveRef.current = null; // Reset the promise resolver
      setIsPrinting(false); // Reset the printing status
      setIsModalVisible(false); // Close the modal after printing
    },
  });

  return (
    <div className="">
      {contextHolder}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
        {/* Product List */}
        <div className="lg:col-span-2 p-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative top-10">
            {products.map((product, index) => {
              const finalPrice = Number(
                product.isDiscount
                  ? product.unitPrice - product.discountAmount
                  : product.unitPrice
              ) || 0;

              return (
                <div
                  key={index}
                  className="p-2"
                  onClick={() => handleProductClick(product)}
                >
                  <Card
                    hoverable
                    style={{ width: "100%", height: 200 }}
                    className="p-1"
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
                    <div className="text-center">
                      <h3 className="font-semibold m-0">{product.title}</h3>
                      <h3 className="">{`₦ ${product.unitPrice}`}</h3>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1 p-4 lg:fixed right-4 w-full lg:w-1/4 top-24">
          <h2 className="text-xl font-bold">Cart</h2>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <div className="cart-container">
              {cart.map((item, index) => {
                const finalPrice = Number(
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
            Print
          </Button>,
        ]}
      >
        <Receipt ref={receiptRef} cart={cart} total={total} />
      </Modal>
    </div>
  );
};

export default Store;
