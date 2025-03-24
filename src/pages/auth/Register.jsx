import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import axios from "axios";
import {
  Card,
  Input,
  Form,
  Button,
  Row,
  Col,
  DatePicker,
  Upload,
  message,
} from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import { useAuthConfig } from "../../context/AppState";

const Register = () => {
  const { baseUrl } = useAuthConfig();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [storeLogoFileList, setStoreLogoFileList] = useState([]);
  const [storeBannerFileList, setStoreBannerFileList] = useState([]);
  const [avatarFileList, setAvatarFileList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const navigate = useNavigate();

  const onFinish = async (values) => {
    const regUrl = `${baseUrl}/register-shop`;

    const formData = new FormData();
    formData.append('firstName', values.firstName);
    formData.append('lastName', values.lastName);
    formData.append('shopName', values.shopName);
    formData.append('storeAddress', values.storeAddress);
    formData.append('email', values.email);
    formData.append('phone', values.phone);
    formData.append('dob', selectedDate?.format('YYYY-MM-DD') || '');
    formData.append('password', values.password);

    // Append files to the FormData object
    if (storeLogoFileList.length > 0) {
      formData.append('icon', storeLogoFileList[0].originFileObj);
    }
    if (storeBannerFileList.length > 0) {
      formData.append('banner', storeBannerFileList[0].originFileObj);
    }
    if (avatarFileList.length > 0) {
      formData.append('avatar', avatarFileList[0].originFileObj);
    }

    try {
      setLoading(true);
      const response = await axios.post(regUrl, formData);
      messageApi.open({
        type: 'success',
        content: "Registration successful!",
      })

      setTimeout(() => {
        navigate("/otp-verification");
      }, 2000);

      console.log("Registration successful:", response);
    } catch (error) {
      console.log("Registration failed:", error);
      messageApi.open({
        type: 'error',
        content: "Registration failed, please try again!",
      })
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const onChangeDate = (date) => {
    setSelectedDate(date);
  };

  const handleFileChange = (fileType) => ({ fileList }) => {
    if (fileType === 'icon') {
      setStoreLogoFileList(fileList);
    } else if (fileType === 'banner') {
      setStoreBannerFileList(fileList);
    } else if (fileType === 'avatar') {
      setAvatarFileList(fileList);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      {contextHolder}
      <Card style={{ width: "100%", maxWidth: 600 }}>
        <Form
          name="register"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[
                  { required: true, message: "Please input your first name!" },
                  { min: 4, message: "First name must be at least 4 characters" },
                ]}
              >
                <Input placeholder="Enter first name" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[
                  { required: true, message: "Please input your last name!" },
                  { required: true, message: "Last name must be at least 4 characters" },
                ]}
              >
                <Input placeholder="Enter last name" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Store Name"
                name="shopName"
                rules={[{ required: true, message: "Please input your store name!" }]}
              >
                <Input placeholder="Enter store name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Store Address"
                name="storeAddress"
                rules={[{ required: true, message: "Please input your store address!" }]}
              >
                <Input placeholder="Enter store address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: 'email', message: "Please enter a valid email!" },
                ]}
              >
                <Input placeholder="Enter email" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  { required: true, message: "Please input your phone number!" },
                  { len: 10, message: "Phone number must be 10 digits" },
                ]}
              >
                <Input placeholder="Enter phone number" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Date of Birth"
                name="dob"
                rules={[{ required: true, message: "Please input your date of birth!" }]}
              >
                <DatePicker value={selectedDate} onChange={onChangeDate} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Store Logo (Optional)" name="icon">
                <Upload
                  listType="picture"
                  fileList={storeLogoFileList}
                  onChange={handleFileChange('icon')}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                    Click to Upload
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Store Banner (Optional)" name="banner">
                <Upload
                  listType="picture"
                  fileList={storeBannerFileList}
                  onChange={handleFileChange('banner')}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                    Click to Upload
                  </Button>
                </Upload>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Avatar (Optional)" name="avatar">
                <Upload
                  listType="picture"
                  fileList={avatarFileList}
                  onChange={handleFileChange('avatar')}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                    Click to Upload
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password
                  placeholder="Enter password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Confirm password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex align-center justify-center">
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "30%", background: "#000" }}
              loading={loading}
            >
              {loading ? "Please wait..." : "Register"}
            </Button>
          </div>

          <div className="text-xs text-center pt-2">
            Already have an account? <NavLink to="/">Login</NavLink>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
