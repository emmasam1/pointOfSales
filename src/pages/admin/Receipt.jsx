import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import DotLoader from "react-spinners/DotLoader";
import { useReactToPrint } from "react-to-print";

const ReceiptSearch = () => {
  const { baseUrl, token } = useAuthConfig();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [receiptData, setReceiptData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const receiptRef = useRef();
  const receiptWidth = "90mm";

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${baseUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data.products);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, [token]);

  const onFinish = async ({ receiptId }) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/receipts/search?receiptCode=${receiptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const receipt = response.data.receipt;

      const enrichedProducts = receipt.products.map((item) => {
        const product = products.find((p) => p._id === item.product);
        return { ...item, productDetails: product || null };
      });

      const enrichedReceipt = {
        ...receipt,
        enrichedProducts,
      };

      console.log(enrichedReceipt);
      setReceiptData(enrichedReceipt);
      setIsModalVisible(true);
      messageApi.success("Receipt loaded successfully.");
    } catch (error) {
      console.error("Error fetching receipt:", error);
      messageApi.error("Error searching receipt.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle actual printing
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onBeforePrint: async () => {
      setLoading(true);
      try {
        await axios.post(
          `${baseUrl}/reprint`,
          { receiptId: receiptData?._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        messageApi.success("Receipt re-printed!");
        await new Promise((res) => setTimeout(res, 200));
        return true;
      } catch (error) {
        messageApi.error("Re-print failed. Printing canceled.");
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

  const getAllReceipt = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receipt = response.data;
      console.log(receipt)
      // setReceiptData(receipt);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      messageApi.error("Error fetching receipt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {  
      getAllReceipt();
    }
  }, [token]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB");
  const formatTime = (date) => new Date(date).toLocaleTimeString("en-US");

  return (
    <div className="p-2">
      {contextHolder}

      <div className="flex justify-end">
        <Form form={form} onFinish={onFinish} layout="inline">
          <Form.Item
            name="receiptId"
            rules={[
              { required: true, message: "Please enter receipt ID" },
              { pattern: /^\d+$/, message: "Must be numeric" },
            ]}
          >
            <Input
              placeholder="Enter receipt ID"
              maxLength={10}
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

      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={
          <Button type="primary" onClick={handlePrint} loading={loading}>
            Re-Print Receipt
          </Button>
        }
      >
        {loading || !receiptData ? (
          <DotLoader color="#1890ff" loading={true} size={60} />
        ) : (
          <div
            ref={receiptRef} // ✅ Printable content
            className="p-4 relative"
            style={{ width: "90mm", margin: "auto" }}
          >
            <h2 className="text-xl font-bold mb-2">
              {receiptData.shop?.name || "Shop"}
            </h2>
            <p className="text-sm mb-1 font-semibold">
              {receiptData.shop?.shopAddress || "Shop Address"}
            </p>
            <p className="text-sm mb-1 font-semibold">
              Tel: {receiptData.shop?.shopPhone}
            </p>
            <p className="text-sm mb-2 font-semibold">
              Email: {receiptData.shop?.shopEmail}
            </p>

            <div className="flex justify-between">
              <p>{formatDate(receiptData.soldAt)}</p>
              <p>{formatTime(receiptData.soldAt)}</p>
            </div>
            <div className="flex justify-between">
              <p>Cashier:</p>
              <p className="uppercase font-semibold">
                {receiptData.cashier?.firstName} {receiptData.cashier?.lastName}
              </p>
            </div>
            <h2 className="watermark">{receiptData.shop?.name}</h2>
            {receiptData.printCount > 1 ? (
              <h2 className="copy_watermark">copy</h2>
            ) : null}

            <div className="flex justify-between">
              <p>Receipt No:</p>
              <p>{receiptData.receiptCode}</p>
            </div>

            <div className="text-center">
              {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
            </div>

            <div className="font-bold flex justify-between mb-1">
              <span className="w-3/9">Item</span>
              <span className="w-2/12 text-center">Qty</span>
              <span className="w-3/12 text-center">Unit</span>
              <span className="w-4/12 text-right">Total</span>
            </div>

            {receiptData.enrichedProducts?.map((item) => (
              <div key={item._id} className="flex justify-between">
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

            <div className="text-center">
              {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
            </div>

            <div className="flex justify-between font-bold">
              <span>Total:</span>
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
            <div className="text-center">
              {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
            </div>

            <p className="text-center mt-3 italic text-sm">
              Thanks for your purchase.
            </p>
            <p className="text-right font-bold text-xs">
              No refund after payment.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiptSearch;
