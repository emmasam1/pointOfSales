import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Card, Input, Form, Button, message, Modal } from "antd";

const ForgetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const onFinish = (values) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsModalVisible(true);

      // Redirect after 5 seconds
      setTimeout(() => {
        setIsModalVisible(false);
        navigate("/set-password"); // change this path as needed
      }, 5000);
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      {contextHolder}
      <Card className="sm:w-auto max-w-sm !px-2">
        <h1 className="text-center text-2xl md:text-2xl font-bold mb-4">
          Reset Password
        </h1>
        <p className="text-center md:text-sm text-sm mb-6">
          Provide your Email to Reset Password
        </p>
        <Form
          name="reset-password"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            className="!-mb-0"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <div className="flex justify-center items-center my-2">
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", background: "#000" }}
              className="mb-2 !w-30 !rounded-full text-[.7rem] px-7 text-sm"
              loading={loading}
            >
              {loading ? "Please wait..." : "Re-set Password"}
            </Button>
          </div>
          <div className="flex gap-1 items-center mt-4">
            <div className="text-xs">Remembered your password?</div>
            <NavLink to="/" className="text-xs">
              Login
            </NavLink>
          </div>
        </Form>
      </Card>

      <Modal
        open={isModalVisible}
        footer={null}
        closable={false}
        centered
      >
        <p className="text-center text-base">
          A reset link has been sent to your email.
        </p>
      </Modal>
    </div>
  );
};

export default ForgetPassword;
