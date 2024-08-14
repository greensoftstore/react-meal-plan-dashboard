import React, { useEffect, useRef, useState } from 'react';
import { MinusCircleOutlined, PlusOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    Button,
    Form,
    Input,
    Select,
    Space,
    Upload,
    message,
    Row,
    Col,
    Image
} from 'antd';
import {
    getDownloadURL,
    ref as storageRef,
    uploadBytes,
    deleteObject
} from "firebase/storage";
import { ref, set, push, get, update, remove } from "firebase/database";
import { v4 } from 'uuid';

import { db, storage } from '../firebase.config'; 


const { TextArea } = Input;

const normFile = (e) => {
    if (Array.isArray(e)) {
        return e;
    }

    return e?.fileList;
};


const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        message.error('Image must smaller than 2MB!');
    }
    return isJpgOrPng && isLt2M;

};

const DetailCmp = ({data, setDefault}) => {
    const [form] = Form.useForm();
    const [mealDataObj, setMealDataObj] = useState({});
    const [mealDataImg, setMealDataImg] = useState('');
    const [itemListData, setItemListData] = useState([]);

    useEffect(() => {
        if(data.key) {
            setMealDataObj(data);
            setMealDataImg(data.img);

            const itemRef = ref(db, '/meal_items');
            get(itemRef).then(itemSnapshot => {
                if (itemSnapshot.exists()) {
                    let itemList = [];
                    itemSnapshot.forEach((childSnapshot) => {
                        const childData = childSnapshot.val();
                        const itemData = {...childData, key: childSnapshot.key}
                        if (itemData['meal'] === data.key) {
                            itemList.push(itemData);
                        }
                    });

                    setItemListData(itemList);
                    setImageUpload(null);
                    setFileList([]);

                    form.setFieldsValue({ name: data.name, items: itemList, instruction: data.instruction, difficulty: data.difficulty, time: data.time, image: [] })

                } else {
                    form.setFieldsValue({ name: data.name, items: [], instruction: data.instruction, difficulty: data.difficulty, time: data.time, image: [] })
                }
            });
        }
    }, [data])

    const [isLoading, setIsLoading] = useState(false);
    const [imageUpload, setImageUpload] = useState(null);
    const [fileList, setFileList] = useState([]);

    const handleChange = (info) => {
        setFileList(info.fileList);
        setImageUpload(info.fileList[0]);

        info.file.status = 'done'
    };

    const onFinish = (values) => {
        if(mealDataObj.key) {
            setIsLoading(true);
            if(imageUpload == null) {
                if(mealDataImg == '') {
                    if(mealDataObj.img == '') {
                        updateData(mealDataObj.key, values, mealDataImg);
                    } else {
                        const fileName = mealDataObj.img.match(/meal_images%2F([^\?]+)/)[1];
                        deleteObject(storageRef(storage, `meal_images/${fileName}`))
                        .then(() => {
                            
                            updateData(mealDataObj.key, values, mealDataImg);
                        }).catch((error) => {
                            message.error(error);
                        });
                    }
                } else {
                    updateData(mealDataObj.key, values, mealDataImg);
                }
            } else {
                const type = imageUpload.type;
                const extension = type.split("/")[1];
                
                const imageRef = storageRef(storage, `meal_images/${v4()}.${extension}`);

                if(mealDataObj.img == '') {
                    uploadBytes(imageRef, imageUpload.originFileObj)
                    .then((snapshot) => {
                        getDownloadURL(snapshot.ref)
                        .then((url) => {
                            updateData(mealDataObj.key, values, url);
                        })
                        .catch((error) => {
                            message.error(error.message);
                            setIsLoading(false);
                        });
                    })
                    .catch((error) => {
                        message.error(error.message);
                        setIsLoading(false);
                    });
                } else {
                    const fileName = mealDataObj.img.match(/meal_images%2F([^\?]+)/)[1];
                    deleteObject(storageRef(storage, `meal_images/${fileName}`))
                    .then(() => {
                        
                        uploadBytes(imageRef, imageUpload.originFileObj)
                        .then((snapshot) => {
                            getDownloadURL(snapshot.ref)
                            .then((url) => {
                                updateData(mealDataObj.key, values, url);
                            })
                            .catch((error) => {
                                message.error(error.message);
                                setIsLoading(false);
                            });
                        })
                        .catch((error) => {
                            message.error(error.message);
                            setIsLoading(false);
                        });
                    }).catch((error) => {
                        message.error(error);
                    });
                }
            }
        } else {
            setIsLoading(true);

            if(imageUpload == null) {
                saveData('', values);
            } else {
                const type = imageUpload.type;
                const extension = type.split("/")[1];
                
                const imageRef = storageRef(storage, `meal_images/${v4()}.${extension}`);
    
                uploadBytes(imageRef, imageUpload.originFileObj)
                .then((snapshot) => {
                    getDownloadURL(snapshot.ref)
                    .then((url) => {
                        saveData(url, values);
                    })
                    .catch((error) => {
                        message.error(error.message);
                        setIsLoading(false);
                    });
                })
                .catch((error) => {
                    message.error(error.message);
                    setIsLoading(false);
                });
            }
        }
    };

    const saveData = (url, values) => {
        const { items, image, ...data } = values;
        const mealData = {...data, img: url};
        
        push(ref(db, 'meal_data/'), mealData)
        .then((res) => {
            if(items && items.length > 0) {
                items.map(item => {
                    item.location = !item.location ? '' : item.location;
                    const itemData = {...item, meal: res.key}
                    push(ref(db, 'meal_items/'), itemData);
                })
            } 

            form.setFieldsValue({ name: '', items: [], instruction: '', difficulty: 0, time: 0, image: [] });
            setFileList([]);
            setImageUpload(null);
            
            setIsLoading(false);
        })
        .catch((error) => {
            message.error(error.message);
            setIsLoading(false);
        });
    }


    const updateData = (key, values, imgUrl) => {
        const { items } = values;
        
        // push(ref(db, 'meal_data/'), mealData)
        update(ref(db, `/meal_data/${key}`), 
        {
            name: values.name,
            time: values.time,
            difficulty: values.difficulty,
            instruction: values.instruction,
            img: imgUrl
        }).then(() => {
            if(items && items.length > 0) {
                const mealItems = itemListData.filter(item => item.meal == key);

                mealItems.map(item1 => {
                    let deleteCheck = true;
                    items.map(item2 => {
                        if(item1.key == item2.key) {
                            deleteCheck = false;
                            return;
                        }
                    })

                    if(deleteCheck) {
                        remove(ref(db, `/meal_items/${item1.key}`))
                    }
                })

                items.map(item => {
                    if(item.key) {
                        update(ref(db, `/meal_items/${item.key}`), 
                        {
                            name: item.name,
                            amount: item.amount,
                            location: item.location,
                        });
                    } else {
                        item.location = !item.location ? '' : item.location;
                        const itemData = {...item, meal: key}
                        push(ref(db, 'meal_items/'), itemData);
                    }
                })
            } else {
                const mealItems = itemListData.filter(item => item.meal == key)
                mealItems.map(item => {
                    remove(ref(db, `/meal_items/${item.key}`))
                })
            }

            form.setFieldsValue({ name: '', items: [], instruction: '', difficulty: 0, time: 0, image: [] });
            setFileList([]);
            setImageUpload(null);
            setMealDataObj({});
            setMealDataImg('');
            
            setIsLoading(false);
        })
        .catch((error) => {
            message.error(error.message);
            setIsLoading(false);
        });
    }


    const setAsDefault = () => {
        setDefault()
        setMealDataObj({});
        setMealDataImg('');
        setImageUpload(null);
        setFileList([]);
        form.setFieldsValue({ name: '', items: [], instruction: '', difficulty: 0, time: 0, image: [] });
    }


    const deleteImage = () => {
        setMealDataImg('');
    }

    const uploadButton = (
        <button
            style={{
                border: 0,
                background: 'none',
            }}
            type="button"
        >
            <PlusOutlined />
            <div
                style={{
                    marginTop: 8,
                }}
            >
                    Upload
            </div>
        </button>
    );

    return (
        <Form
            labelCol={{
                span: 4,
            }}
            wrapperCol={{
                span: 20,
            }}
            layout="horizontal"
            variant="filled"
            onFinish={onFinish}
            disabled={isLoading ? true : false}
            form={form}
        >

            <Form.Item 
                label="Meal Name" 
                name="name"
                rules={[
                    {
                    required: true,
                    message: 'Please input!',
                    },
                ]}
            >
                <Input />
            </Form.Item>

            <Form.List 
                name="items"
            >
                {(fields, { add, remove }, { errors }) => (
                    <>
                        <Form.Item label='Items'>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Add field
                            </Button>
                        </Form.Item>

                        {fields.map(({ key, name, ...restField }) => (
                            <Space
                                key={key}
                                style={{
                                    display: 'flex',
                                    marginTop: 8,
                                    justifyContent: 'flex-end'
                                }}
                                align="baseline"
                            >
                                <Form.Item
                                    {...restField}
                                    name={[name, 'name']}
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Missing item name',
                                        },
                                    ]}
                                >
                                    <Input placeholder="Item Name" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'amount']}
                                    rules={[
                                    {
                                        required: true,
                                        message: 'Missing item amount',
                                    },
                                    ]}
                                >
                                    <Input placeholder="Item Amount" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'location']}
                                >
                                    <Input placeholder="Item Location"  style={{width: 250}}/>
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => remove(name)} />
                            </Space>
                        ))}
                    </>
                )}
            </Form.List>
            
            <Form.Item label="Instruction" name='instruction' initialValue={''}>
                <TextArea rows={6} />
            </Form.Item>

            <Form.Item label="Difficulty" name='difficulty' initialValue={0}>
                <Select
                    defaultValue={0}
                    style={{ width: 250 }}
                    options={[
                        { value: 0, label: 'Easy' },
                        { value: 1, label: 'Normal' },
                        { value: 2, label: 'Difficult' },
                    ]}
                />
            </Form.Item>

            <Form.Item label="Time" name='time' initialValue={0}>
                <Select
                    defaultValue={0}
                    style={{ width: 250 }}
                    options={[
                        { value: 0, label: 'Short' },
                        { value: 1, label: 'Medium' },
                        { value: 2, label: 'Long' },
                    ]}
                />
            </Form.Item>
            
            <Form.Item label="Image" name='image' valuePropName="fileList" getValueFromEvent={normFile}>
                {
                    mealDataImg != '' ? 
                        <Row>
                            <Image
                                width={100}
                                src={mealDataImg}
                            />
                            <DeleteOutlined style={{alignSelf: 'flex-end', fontSize: 25, color: 'red', marginLeft: 10}} onClick={() => {deleteImage()}}/>
                        </Row>
                    : 
                        <Upload
                            name="avatar"
                            listType="picture-card"
                            beforeUpload={beforeUpload}
                            fileList={fileList}
                            onChange={handleChange}
                            showUploadList={{
                                showPreviewIcon:false
                            }}
                        >
                            {fileList.length >= 1 ? null : uploadButton}
                        </Upload>
                }
            </Form.Item>

            

            <Form.Item
                style={{display: 'flex', justifyContent: 'flex-end'}}
            >
                <Row style={{width: 250}}>
                    <Col span={12} style={{textAlign: 'center'}}>
                        {
                            mealDataObj.key ?
                            <Button type="" htmlType="button" onClick={() => {setAsDefault()}}>
                                Cancle
                            </Button>
                            : ''
                        }
                    </Col>
                    <Col span={12} style={{textAlign: 'center'}}>
                        <Button type="primary" htmlType="submit" loading={isLoading}>
                            {mealDataObj.key ? 'Update' : 'SAVE'}
                        </Button>
                    </Col>
                </Row>
            </Form.Item>

        </Form>
    );
};

export default DetailCmp;