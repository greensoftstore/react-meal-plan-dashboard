import React, { useEffect, useState } from 'react';
import { Col, Row, Table, Input, Tag, Button, Pagination, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Detail from './detail';
import { ref, onValue, push, remove, get } from "firebase/database";
import { ref as storageRef, deleteObject } from "firebase/storage";

import { db, storage } from '../firebase.config';

const { Search } = Input;


const ContainerCmp = () => {
    const [open, setOpen] = useState(false);
    const [itemData, setItemData] = useState({});

    const columns = [
        {
            title: 'Image',
            dataIndex: 'img',
            width: '15%',
            render: (img) => {
                return (
                    <img 
                        width={70}
                        height={70}
                        src={img == '' ? require('../defult.png') : img}
                    />
                )
            },
        },
        {
            title: 'Name',
            dataIndex: 'name',
            width: '35%',
        },
        {
            title: 'Difficulty',
            dataIndex: 'difficulty',
            render: (item) => {
                return item == 0 ? <Tag color="green">Easy</Tag> : item == 1 ? <Tag color="gold">Normal</Tag> : <Tag color="red">Difficult</Tag>
            },
            width: '15%',
        },
        {
            title: 'Time',
            dataIndex: 'time',
            render: (item) => {
                return item == 0 ? <Tag color="green">Short</Tag> : item == 1 ? <Tag color="gold">Medium</Tag> : <Tag color="red">Long</Tag>
            },
            width: '15%',
        },
        {
            title: 'Actions',
            dataIndex: '',
            width: '20%',
            render: (item) => {
                return (
                    <Row>
                        <Col span={12} style={{textAlign: 'center'}}>
                            {/* <Button type="primary" icon={<EditOutlined />} size={'middle'} onClick={() => {editModal(item)}}/> */}
                            <Button type="primary" icon={<EditOutlined />} size={'middle'} onClick={() => {setItemData(item)}}/>
                        </Col>
                        <Col span={12} style={{textAlign: 'center'}}>
                            {/* <Button type="primary" danger icon={<DeleteOutlined />} size={'middle'} onClick={() => {modal.confirm(modalConfig).then(deleteData(item.key, item.img))}}/> */}
                            <Button type="primary" danger icon={<DeleteOutlined />} size={'middle'} onClick={() => {deleteModal(item.key, item.img)}}/>
                        </Col>
                    </Row>
                )
            },
        },
    ];
    
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState('');
    const [deleteImg, setDeleteImg] = useState('');
    const [search, setSearch] = useState('');
    const [tableParams, setTableParams] = useState({
        pagination: {
          current: 1,
          pageSize: 5,
        },
      });


    const fetchData = () => {
        setLoading(true);
        
        onValue(ref(db, 'meal_data/'), querySnapShot => {

            let data = querySnapShot.val() || {};
            let mealList = {...data};
            let list = [];
            Object.keys(mealList).map(item => {
                let info = {};

                info.name = mealList[item].name;
                info.img = mealList[item].img;
                info.instruction = mealList[item].instruction;
                info.difficulty = mealList[item].difficulty;
                info.time = mealList[item].time;
                info.key = item;

                list.push(info);
            })

            if(search != '') {
                const mainList = list.filter(item => item.name.includes(search))
                setData(mainList);
            } else {
                setData(list);
            }

            setLoading(false);
        });
    };


    useEffect(() => {
        fetchData();
    }, [JSON.stringify(tableParams)]);


    const deleteModal = (id, imgUrl) => {
        setOpen(true);
        setDeleteId(id);
        setDeleteImg(imgUrl);
    }

    const deleteData = async () => {
        setLoading(true);
        
        const itemRef = ref(db, '/meal_items');
        const itemSnapshot = await get(itemRef);
        if (itemSnapshot.exists()) {
            itemSnapshot.forEach((childSnapshot) => {
                const childData = childSnapshot.val();
                if (childData['meal'] === deleteId) {
                    const itemToRemoveRef = ref(db, `meal_items/${childSnapshot.key}`);
                    remove(itemToRemoveRef);
                }
            });
            
            remove(ref(db, `/meal_data/${deleteId}`))
            .then(() => {   
                if(deleteImg != '') {
                    const fileName = deleteImg.match(/meal_images%2F([^\?]+)/)[1];
                    
                    deleteObject(storageRef(storage, `meal_images/${fileName}`))
                    .then(() => {
                        setOpen(false);
                        fetchData();
                        
                    }).catch((error) => {
                        message.error(error);
                    });
                } else {
                    setOpen(false);
                    fetchData();
                }
            }).catch((error) => {
                message.error(error);
            });
        }
    }


    const handleTableChange = (pagination) => {
        setTableParams({
            pagination
        });
    };

    const onSearch = (value, _e, info) => {
        fetchData();
    }


    return (
        <Row>
            <Col xl={12} lg={24} md={24} sm={24} style={{paddingLeft: 20, paddingRight: 20}}>
                <Row>
                    <h2>Meal List</h2>
                </Row>
                <Row style={{justifyContent: 'flex-end'}}>
                    <Search style={{width: 300}} placeholder="input search text" onChange={(e) => {setSearch(e.target.value)}} onSearch={onSearch} enterButton />
                </Row>
                <Table
                    columns={columns}
                    // rowKey={(record) => record.login.uuid}
                    dataSource={data}
                    pagination={tableParams.pagination}
                    loading={loading}
                    onChange={handleTableChange}
                />
                <Modal
                    title="Meal Data Delete!"
                    open={open}
                    onOk={() => deleteData()}
                    onCancel={() => setOpen(false)}
                    okText="Delete"
                    cancelText="Cancel"
                >
                    <h3>Are you sure you want to delete this meal data?</h3>
                </Modal>
            </Col>
            <Col xl={12} lg={24} md={24} sm={24} style={{paddingLeft: 20, paddingRight: 20}}>
                <Row style={{justifyContent: 'flex-end'}}>
                    <h2>Meal Detail Info</h2>
                </Row>
                <Detail data={itemData} setDefault={() => setItemData({})}/>
            </Col>
        </Row>
    );
};
export default ContainerCmp;