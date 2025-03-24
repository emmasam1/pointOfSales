import { useState } from "react";
import { Card, Input, Button, message, Form } from "antd";
import { useAuthConfig } from "../../context/AppState";
import axios from "axios";
import { useNavigate } from "react-router";


const Verify = () => {
  const { baseUrl } = useAuthConfig();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  const onChange = (text) => {
    setOtp(text);
  };
  
  const onInput = (value) => {
    console.log("onInput:", value);
  };
  
  const sharedProps = {
    onChange,
    onInput,
  };
  

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleVerify = async () => {
    if (otp.length != 6) {
      messageApi.open({
        type: "error",
        content: "OTP must be 6 digits!",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${baseUrl}/verify-account`, { code: otp });
      if (response.data.success) {
        messageApi.open({
          type: "success",
          content: "OTP Verified successfully!",
        });
        
        setTimeout(() => {
          navigate("/");
        }, 2000);

      } else {
        messageApi.open({
          type: "error",
          content: "Invalid OTP. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      messageApi.open({
        type: "error",
        content: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      {contextHolder}
      <Card >
        <h2 className="text-center text-xl font-bold uppercase mb-2">Verify OTP</h2>
        <Form onFinish={handleVerify}>
          <Form.Item className="!-mb-0">
            <Input.OTP
              value={otp}
              name="otp"
              onChange={handleOtpChange}
              maxLength={6}
              {...sharedProps}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              className="w-full mt-4 !bg-black"
              htmlType="submit"
              loading={loading}
            >
              Verify
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Verify;
