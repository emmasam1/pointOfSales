import React, { useState } from "react";
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

  // const onFinish = async ({ receiptId }) => {
  //   setLoading(true);
  //   try {
  //     const response = await axios.get(
  //       `${baseUrl}/receipts/search?receiptCode=${receiptId}`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     if (response.status === 200 && response.data.receipt) {
  //       const receipt = response.data.receipt;
  //       console.log("🧾 Raw receipt:", receipt);

  //       // 1️⃣ Fetch product details
  //       const productIds = receipt.products.map(p => p.product);
  //       console.log("📦 Product IDs:", productIds);

  //       const productDetailsRes = await axios.get(
  //         `${baseUrl}/products?ids=${productIds.join(",")}`,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );

  //       const productDetails = productDetailsRes.data.products;
  //       console.log("📦 Full product details:", productDetails);

  //       const productMap = {};
  //       productDetails.forEach(product => {
  //         productMap[product._id] = product;
  //       });

  //       const productsWithDetails = receipt.products.map(p => ({
  //         ...p,
  //         product: productMap[p.product] || p.product,
  //       }));

  //       receipt.products = productsWithDetails;

  //       // 2️⃣ Fetch cashier details
  //       let cashierDetails = null;
  //       if (receipt.cashier) {
  //         const cashierRes = await axios.get(
  //           `${baseUrl}/users/${receipt.cashier}`,
  //           {
  //             headers: { Authorization: `Bearer ${token}` },
  //           }
  //         );
  //         cashierDetails = cashierRes.data.user;
  //         console.log("👤 Cashier details:", cashierDetails);
  //       }

  //       receipt.cashier = cashierDetails || receipt.cashier;

  //       console.log("✅ Final enriched receipt:", receipt);

  //       setReceiptData(receipt);
  //       messageApi.success("Receipt loaded successfully.");
  //       setIsModalVisible(true);
  //     } else {
  //       messageApi.error("Receipt not found.");
  //     }
  //   } catch (error) {
  //     console.error("❌ Error fetching receipt:", error);
  //     messageApi.error("Error searching receipt. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const onFinish = async ({ receiptId }) => {
    setLoading(true);
    try {
      // 1️⃣ Fetch receipt by receiptId
      const response = await axios.get(
        `${baseUrl}/receipts/search?receiptCode=${receiptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.status === 200 && response.data.receipt) {
        const receipt = response.data.receipt;
        console.log("🧾 Raw receipt:", receipt);
  
        // 2️⃣ Fetch product details
        const productIds = receipt.products.map((p) => p.product);
        console.log("📦 Product IDs:", productIds);
  
        const productDetailsRes = await axios.get(
          `${baseUrl}/products?ids=${productIds.join(",")}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        const productDetails = productDetailsRes.data.products;
        console.log("📦 Full product details:", productDetails);
  
        const productMap = {};
        productDetails.forEach((product) => {
          productMap[product._id] = product;
        });
  
        const productsWithDetails = receipt.products.map((p) => ({
          ...p,
          product: productMap[p.product] || p.product,
        }));
  
        receipt.products = productsWithDetails;
  
        // 3️⃣ Fetch cashier details
        let cashierDetails = null;
        if (receipt.cashier) {
          const cashierRes = await axios.get(
            `${baseUrl}/users/${receipt.cashier}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          cashierDetails = cashierRes.data.user;
          console.log("👤 Cashier details:", cashierDetails);
          receipt.cashier = cashierDetails;
        }
  
        // 4️⃣ Fetch store (shop) details from cashier.parentShop
        let storeDetails = null;
        const storeId = cashierDetails?.parentShop;
        if (storeId) {
          try {
            const storeRes = await axios.get(
              `${baseUrl}/shops/${storeId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            storeDetails = storeRes.data.shop;
            console.log("🏬 Store details:", storeDetails);
          } catch (storeError) {
            console.error("⚠️ Failed to fetch store details:", storeError);
          }
        } else {
          console.warn("⚠️ No parentShop ID found on cashier.");
        }
  
        // Attach store to receipt
        receipt.store = storeDetails;
  
        // 5️⃣ Done — Set data
        console.log("✅ Final enriched receipt:", receipt);
        setReceiptData(receipt);
        messageApi.success("Receipt loaded successfully.");
        setIsModalVisible(true);
      } else {
        messageApi.error("Receipt not found.");
      }
    } catch (error) {
      console.error("❌ Error fetching receipt:", error);
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
    <div className="p-2 flex justify-end">
      {contextHolder}
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
              {receiptData.shop?.name || "Shop"}
            </h2>
            
            
            <div className="flex justify-between items-center">
            <p className="receipt">{formatTime(receiptData.soldAt)}</p>
            <p className="receipt">{formatDate(receiptData.soldAt)}</p>
            </div>
            {/* Cashier Info */}
            <div className="flex justify-between items-center">
              <p className="receipt">Cashier:</p>
              <p className="receipt uppercase font-bold">
                {typeof receiptData.cashier === "object"
                  ? `${receiptData.cashier.firstName} ${receiptData.cashier.lastName}`
                  : receiptData.cashier}
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

            {receiptData.products?.map((item, index) => (
              <div key={item._id} className="flex justify-between py-1">
                <span className="w-3/9">
                  {index + 1}.{" "}
                  {typeof item.product === "object"
                    ? item.product.title
                    : item.product}
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
              <span>Total Amount::</span>
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
