import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Input,
  Modal,
  Form,
  Upload,
  message,
  Row,
  Col,
  DatePicker,
  Dropdown,
  Select,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import dots from "../../assets/dots.png";
import { NavLink } from "react-router";
import { useAuthConfig } from "../../context/AppState";
import axios from "axios";
import productImg from "../../assets/product-default.png";
import DotLoader from "react-spinners/DotLoader";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"; // only if needed

dayjs.extend(isSameOrBefore);

const Product = () => {
  const { baseUrl, token, user } = useAuthConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [productBeingEdited, setProductBeingEdited] = useState(null);

  const handleCancelProductModal = () => {
    setIsOpen(false);
    form.resetFields();
    setImagePreview(null);
    setImageFile(null);
    setIsEditing(false);
    setProductBeingEdited(null);
  };


  const onFinish = async (values) => {
    const isEdit = isEditing && productBeingEdited?._id;
    const productUrl = isEdit
      ? `${baseUrl}/${productBeingEdited._id}`
      : `${baseUrl}/add-product`;
  
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    if (imageFile) formData.append("image", imageFile);
    formData.append("unitPrice", values.unitPrice);
    formData.append("bulkPrice", values.bulkPrice);
    formData.append("sizes", values.sizes || []);
    formData.append("isTrending", values.isTrending || false);
    formData.append("isDiscount", values.isDiscount || false);
    formData.append("discountAmount", values.discountAmount || 0);
    formData.append("quantity", values.quantity);
    formData.append("manufacturingDate", values.manufacturingDate.format("YYYY-MM-DD"));
    formData.append("expiryDate", values.expiryDate.format("YYYY-MM-DD"));
    formData.append("category", values.category);
  
    try {
      setLoading(true);
      const method = isEdit ? "patch" : "post";
  
      const response = await axios[method](productUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      messageApi.open({
        type: "success",
        content: `Product ${isEdit ? "updated" : "added"} successfully`,
      });
  
      await fetchProducts(); // refresh list
      handleCancelProductModal();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        `An error occurred while ${isEdit ? "updating" : "adding"} the product`;
      messageApi.open({ type: "error", content: errorMessage });
    } finally {
      setLoading(false);
    }
  };
  

  const getCategories = async () => {
    try {
      const response = await axios.get(`${baseUrl}/get-cat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(
        Array.isArray(response.data.categories) ? response.data.categories : []
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while fetching categories";
      messageApi.open({ type: "error", content: errorMessage });
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Failed to fetch products",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNonExpired = () => {
    const now = moment();
    const nonExpired = products.filter((p) =>
      moment(p.expiryDate).isAfter(now)
    );
    setFilteredProducts(nonExpired);
  };

  const filterExpired = () => {
    const now = moment();
    const expired = products.filter((p) => moment(p.expiryDate).isBefore(now));
    setFilteredProducts(expired);
  };

  useEffect(() => {
    if (token) {
      getCategories();
      fetchProducts();
    }
  }, [baseUrl, token]);

  const dataSource = filteredProducts.map((product, index) => ({
    key: product._id || index.toString(),
    title: product.title,
    bulkPrice: product.bulkPrice,
    unitPrice: product.unitPrice,
    quantity: product.quantity,
    expiryDate: moment(product.expiryDate).format("YYYY-MM-DD"),
    manufacturingDate: moment(product.manufacturingDate).format("YYYY-MM-DD"),
    image: product.image,
    category: product.category?.name || "N/A",
  }));

  const columns = [
    {
      title: "S/N",
      dataIndex: "key",
      key: "key",
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "Product Image",
      key: "image",
      render: (_text, record) => (
        <img
          src={record.image ? `${record.image}` : productImg}
          alt={record.title}
          style={{ width: 50, height: 50, objectFit: "cover" }}
        />
      ),
    },
    { title: "Product Name", dataIndex: "title", key: "title" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Bulk Price", dataIndex: "bulkPrice", key: "bulkPrice" },
    { title: "Unit Price", dataIndex: "unitPrice", key: "unitPrice" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Maf. Date",
      dataIndex: "manufacturingDate",
      key: "manufacturingDate",
    },
    { title: "Exp. Date", dataIndex: "expiryDate", key: "expiryDate" },
    {
      title: "Actions",
      key: "operations",
      render: (_record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: (
                  <NavLink
                    to={`/product/${_record.key}`}
                    state={{ record: _record }}
                  >
                    View Product
                  </NavLink>
                ),
              },
              {
                key: "edit",
                label: (
                  <span
                    onClick={() => {
                      const selectedProduct = products.find((p) => p._id === _record.key);
                      if (selectedProduct) {
                        setIsEditing(true);
                        setIsOpen(true);
                        setProductBeingEdited(selectedProduct);
                        form.setFieldsValue({
                          ...selectedProduct,
                          manufacturingDate: dayjs(selectedProduct.manufacturingDate),
                          expiryDate: dayjs(selectedProduct.expiryDate),
                          category: selectedProduct.category?._id || selectedProduct.category,
                        });
                        setImagePreview(selectedProduct.image || null);
                      }
                    }}
                  >
                    Edit
                  </span>
                ),
              },

              {
                key: "delete",
                label: (
                  <span
                    onClick={() => {
                      setProductToDelete(_record);
                      setIsModalVisible(true);
                    }}
                  >
                    Delete
                  </span>
                ),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button>
            <img src={dots} alt="Actions" className="w-1" />
          </Button>
        </Dropdown>
      ),
    },
  ];

  const handleCancel = () => {
    setIsModalVisible(false);
    setProductToDelete(null);
  };

  const deleteProduct = async (_record) => {
    setLoading(true);
    if (loading) return;
    if (!_record || !_record.key) return;

    const productId = _record.key;
    try {
      const response = await axios.delete(`${baseUrl}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.open({
        type: "success",
        content: "Product deleted successfully",
      });
      fetchProducts();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while deleting the product";
      messageApi.open({ type: "error", content: errorMessage });
    } finally {
      setIsModalVisible(false);
      setProductToDelete(null);
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      {contextHolder}
      <Dialog
        open={isModalVisible}
        onClose={handleCancel}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon
                      aria-hidden="true"
                      className="size-6 text-red-600"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle
                      as="h3"
                      className="text-base font-semibold text-gray-900"
                    >
                      Are you sure you want to delete this product?
                    </DialogTitle>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => deleteProduct(productToDelete)}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
      <div className="flex justify-between items-center my-4">
        <Button
          type="primary"
          onClick={() => setIsOpen(true)}
          className="!bg-black"
          size="midium"
        >
          Add Product <PlusOutlined />
        </Button>
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="solid"
            size="midium"
            onClick={() => setFilteredProducts(products)} // Show all products
          >
            All Products
          </Button>
          <Button
            color="green"
            variant="solid"
            size="midium"
            onClick={filterNonExpired}
          >
            Non-expired
          </Button>
          <Button
            color="red"
            variant="solid"
            size="midium"
            onClick={filterExpired}
          >
            Expired
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center my-4 h-60 bg-white">
          <DotLoader />
        </div>
      ) : (
        // Show the table only after the data has been fetched
        <Table
          columns={columns}
          dataSource={dataSource}
          size="small"
          pagination={{
            pageSize: 7,
            position: ["bottomCenter"],
            className: "custom-pagination",
          }}
          className="custom-table min-w-[600px]"
        />
      )}

      <Modal
        title={isEditing ? "Edit Product" : "Add Product"}
        open={isOpen}
        onCancel={handleCancelProductModal}
        footer={null}
      >
        <Form form={form} name="product" layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Product Name"
                name="title"
                className="mb-2"
                rules={[
                  { required: true, message: "Please input product name!" },
                ]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Description"
                name="description"
                className="mb-2"
                rules={[
                  {
                    required: true,
                    message: "Please input product description!",
                  },
                ]}
              >
                <Input.TextArea placeholder="Enter product description" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Unit Price"
                name="unitPrice"
                className="mb-2"
                rules={[
                  { required: true, message: "Please input unit price!" },
                ]}
              >
                <Input placeholder="Enter unit price" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bulk Price"
                name="bulkPrice"
                className="mb-2"
                rules={[
                  { required: true, message: "Please input bulk price!" },
                ]}
              >
                <Input placeholder="Enter bulk price" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Sizes"
                name="sizes"
                className="mb-2"
                rules={[
                  {
                    required: true,
                    message: "Please select at least one size!",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select sizes"
                  options={[
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                  ]}
                ></Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Is Trending"
                name="isTrending"
                valuePropName="checked"
                className="mb-2"
              >
                <Input type="checkbox" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Is Discount"
                name="isDiscount"
                valuePropName="checked"
                className="mb-2"
              >
                <Input type="checkbox" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Discount Amount"
                name="discountAmount"
                className="mb-2"
              >
                <Input placeholder="Enter discount amount" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Quantity"
                name="quantity"
                className="mb-2"
                rules={[{ required: true, message: "Please input quantity!" }]}
              >
                <Input placeholder="Enter quantity" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Manufacturing Date"
                name="manufacturingDate"
                className="mb-2"
                rules={[
                  {
                    required: true,
                    message: "Please select manufacturing date!",
                  },
                  {
                    validator(_, value) {
                      if (value && value.isAfter(moment(), "day")) {
                        return Promise.reject(
                          new Error(
                            "Manufacturing date cannot be in the future!"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select manufacturing date"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Expiry Date"
                name="expiryDate"
                className="mb-2"
                rules={[
                  {
                    required: true,
                    message: "Please select expiry date!",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const manufDate = getFieldValue("manufacturingDate");

                      const expiry = value ? dayjs(value) : null;
                      const manufacturing = manufDate ? dayjs(manufDate) : null;
                      const today = dayjs();

                      // console.log(
                      //   "🔍 Expiry Selected:",
                      //   expiry?.format("YYYY-MM-DD")
                      // );
                      // console.log(
                      //   "🧪 Manufacturing Date:",
                      //   manufacturing?.format("YYYY-MM-DD")
                      // );
                      // console.log("📅 Today:", today.format("YYYY-MM-DD"));

                      if (!expiry) {
                        return Promise.reject(
                          new Error("Expiry date is required")
                        );
                      }

                      if (expiry.isBefore(today, "day")) {
                        return Promise.reject(
                          new Error("Expiry date cannot be in the past!")
                        );
                      }

                      if (
                        manufacturing &&
                        expiry.isSameOrBefore(manufacturing, "day")
                      ) {
                        return Promise.reject(
                          new Error(
                            "Expiry date must be after manufacturing date!"
                          )
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select expiry date"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                className="mb-2"
                rules={[
                  { required: true, message: "Please select a category!" },
                ]}
              >
                <Select
                  placeholder="Select category"
                  options={categories.map((cat) => ({
                    value: cat._id,
                    label: cat.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Image Upload Section */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item label="Product Image">
                <Upload
                  accept="image/*"
                  name="image"
                  showUploadList={false} // Prevent the automatic upload
                  beforeUpload={(file) => {
                    const isJpgOrPng =
                      file.type === "image/jpeg" || file.type === "image/png";
                    if (!isJpgOrPng) {
                      message.error("You can only upload JPG/PNG file!");
                    }
                    const isLt2M = file.size / 1024 / 1024 < 2;
                    if (!isLt2M) {
                      message.error("Image must smaller than 2MB!");
                    }
                    setImageFile(file); // Store the file in state
                    const reader = new FileReader();
                    reader.onload = () => {
                      setImagePreview(reader.result); // Set the preview of the image
                    };
                    reader.readAsDataURL(file);
                    return false; // Prevent file from being uploaded automatically
                  }}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="preview"
                    style={{
                      width: "100px",
                      marginTop: "10px",
                      height: "100px",
                    }}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end mt-4">
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="!bg-black"
              >
                {isEditing ? "Update Product" : "Add Product"}
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Product;
