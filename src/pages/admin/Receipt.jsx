import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import DotLoader from "react-spinners/DotLoader";

const ReceiptSearch = () => {
  const { baseUrl, token } = useAuthConfig();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [receiptData, setReceiptData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) {
        console.warn("No token found. Skipping user fetch.");
        return;
      }

      try {
        const response = await axios.get(`${baseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Fetched users:", response.data);
        setUsers(response.data.users); // assuming the API response has a `users` array
      } catch (err) {
        console.error("Failed to fetch users:", err);

        // Optional: You can handle 401 errors specifically
        if (err.response?.status === 401) {
          messageApi.error("Session expired. Please log in again.");
          // optionally trigger logout or redirect
        }
      }
    };

    fetchUsers();
  }, [token]); // make sure it re-runs if token changes

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) {
        console.warn("No token found. Skipping product fetch.");
        return;
      }

      try {
        const response = await axios.get(`${baseUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Fetched products:", response.data);
        setProducts(response.data.products); // assuming `products` is the key
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchProducts();
  }, [token]);

  const onFinish = async ({ receiptId }) => {
    setLoading(true);

    try {
      // Step 1: Fetch the receipt by code
      const response = await axios.get(
        `${baseUrl}/receipts/search?receiptCode=${receiptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const receipt = response.data.receipt;
      console.log(receipt)

      // Step 2: Enrich with cashier details from cached users
      const matchedCashier = users.find((user) => user._id === receipt.cashier);

      // Step 3: Enrich product items with full product details
      const enrichedProducts = receipt.products.map((item) => {
        const matchedProduct = products.find((p) => p._id === item.product);

        console.log("🛒 Product Title:", matchedProduct?.title); // Log product title

        return {
          ...item,
          productDetails: matchedProduct || null, // Add product info here
        };
      });

      // Step 4: Final enriched receipt
      const enrichedReceipt = {
        ...receipt,
        cashierDetails: matchedCashier || null,
        enrichedProducts,
      };

      console.log("Final enriched receipt:", enrichedProducts);

      setReceiptData(enrichedReceipt);
      messageApi.success("Receipt loaded successfully.");
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      messageApi.error("Error searching receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("Text");
    if (!/^\d+$/.test(pasted)) e.preventDefault();
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setReceiptData(null);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US");
  };

  return (
    <div className="p-2 ">
      {contextHolder}
      <div className="flex justify-end">
        <Form
          form={form}
          onFinish={onFinish}
          layout="inline"
          className="w-full justify-end"
        >
          <Form.Item
            name="receiptId"
            rules={[
              { required: true, message: "Please enter a receipt ID" },
              { pattern: /^\d+$/, message: "Receipt ID must be numeric" },
            ]}
          >
            <Input
              placeholder="Enter receipt ID"
              maxLength={10}
              inputMode="numeric"
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              style={{ width: 250 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {loading ? "Searching..." : "Search Receipt"}
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div>
        <p className="receipt">
          Address: Lorem ipsum, dolor sit amet consectetur adipisicing elit
        </p>
      </div>
      <Modal
        title=""
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        {loading || !receiptData ? (
          <DotLoader color="#1890ff" loading={true} size={60} />
        ) : (
          <div className="p-4" style={{ width: "90mm", margin: "auto" }}>
            <h2 className="text-xl font-bold mb-2">
              {receiptData.cashierDetails?.assignedShop?.name || "Shop"}
            </h2>

            <div className="flex justify-between items-center">
              <p className="receipt">{formatDate(receiptData.soldAt)}</p>
              <p className="receipt">{formatTime(receiptData.soldAt)}</p>
            </div>
            {/* Cashier Info */}
            <div className="flex justify-between items-center">
              <p className="receipt">Cashier:</p>
              <p className="receipt uppercase font-bold">
                {receiptData.cashierDetails?.firstName}{" "}
                {receiptData.cashierDetails?.lastName}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p>Receipt No:</p>
              <p className="font-semibold"> {receiptData.receiptCode}</p>
            </div>

            <div className="text-center mt-2 mb-2">{"*".repeat(50)}</div>

            <div className="font-bold flex justify-between mb-1">
              <span className="w-3/9">Description</span>
              <span className="w-2/12 text-center">Qty</span>
              <span className="w-3/12 text-center">Unit Price</span>
              <span className="w-4/12 text-right">Price</span>
            </div>

            {receiptData.enrichedProducts?.map((item, index) => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="w-3/9">
                  {item.productDetails?.title || "N/A"}
                </span>
                <span className="w-2/12 text-center">{item.quantity}</span>
                <span className="w-3/12 text-center">
                  {item.priceAtSale - item.discount}
                </span>
                <span className="w-4/12 text-right">
                  {formatCurrency(
                    (item.priceAtSale - item.discount) * item.quantity
                  )}
                </span>
              </div>
            ))}

            <div className="text-center mt-2 mb-2">{"*".repeat(50)}</div>

            <div className="flex justify-between font-bold">
              <span>Total Amount:</span>
              <span>{formatCurrency(receiptData.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>{formatCurrency(receiptData.discountTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT:</span>
              <span>{formatCurrency(receiptData.vatAmount)}</span>
            </div>
            <div className="text-center mt-2 mb-2">{"*".repeat(50)}</div>

            <div className="text-center mt-4 italic">
              Thanks for your purchase.
            </div>
            <div className="text-right font-bold">No refund after payment.</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiptSearch;
