import React from "react";
import { useAuthConfig } from "../../context/AppState";

// Forward the ref to the component
const Receipt = React.forwardRef((props, ref) => {
  const { cart, total, receiptNumber } = props;
  const { user } = useAuthConfig();

  const getFormattedTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? " PM" : " AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesFormatted}${ampm}`;
  };

  const currentTime = getFormattedTime();

  const getFormattedDate = () => {
    const now = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const currentDate = getFormattedDate();

  // Format currency (NGN) with comma separation
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const receiptWidth = "90mm"; // Specify the width here

  return (
    <div
      className="p-4 relative"
      ref={ref}
      style={{ width: receiptWidth, margin: "auto" }}
    >
      <div>
        <h2 className="text-xl font-bold mb-2">{user.assignedShop.name}</h2>
        <p className="receipt">
          Address: Lorem ipsum, dolor sit amet consectetur adipisicing elit
        </p>
        <p className="receipt">Phone: 08055120900, 08055120900</p>
        <p className="receipt">Email: testStore@gmail.com</p>
      </div>
      <div className="mt-3">
        <div className="flex justify-between">
          <p className="receipt">{currentDate}</p>
          <p className="receipt">{currentTime}</p>
        </div>
        <div className="flex justify-between">
          <p className="receipt">Cashier:</p>
          <p className="receipt uppercase font-bold">
            {user.firstName} {user.lastName}
          </p>
        </div>
        <div className="flex justify-between">
          <p className="receipt">Receipt No:</p>
          <p className="receipt">{receiptNumber}</p>
        </div>
      </div>
      <div className="text-center">
        {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
      </div>
      <div className="mb-4">
        <div className="flex justify-between font-bold">
          <h2 className="text-xs w-3/9 text-left">Description</h2>
          <h2 className="text-xs w-2/12 text-center">Qty</h2>
          <h2 className="text-xs w-3/12 text-center">Unit Price</h2>
          <h2 className="text-xs w-4/12 text-right">Price</h2>
        </div>
        <div className="relative">
          <h2 className="watermark">{user.assignedShop.name}</h2>
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between py-2">
              <div className="flex w-3/9">
                <span className="receipt">{index + 1}.</span>
                <span className="receipt ml-2">{item.title}</span>
              </div>
              <div className="flex w-2/12 justify-center">
                <span className="receipt">{item.quantity}</span>
              </div>
              <div className="flex w-3/12 justify-center">
                <span className="receipt">{item.unitPrice}</span>
              </div>
              <div className="flex w-4/12 justify-end">
                <span className="receipt">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
      </div>
      <div className="flex justify-between font-bold">
        <span>Total Amount:</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <div className="text-center">
        {"*".repeat(Math.floor(parseInt(receiptWidth) / 1.9))}
      </div>
      <h2 className="italic">
        Thanks for coming. We'll love to serve you again.
      </h2>
      <h2 className="font-bold text-right">No refund after payment</h2>
    </div>
  );
});

export default Receipt;
