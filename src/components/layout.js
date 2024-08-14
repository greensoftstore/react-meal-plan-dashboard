import React from 'react';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import ContainerCmp from './container';



const { Header, Content, Footer } = Layout;


const LayoutCmp = () => {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    
    return (
        <Layout style={{minHeight: '100vh'}}>
            <Header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <div className="demo-logo" />
                <Menu
                    theme="dark"
                    mode="horizontal"
                    defaultSelectedKeys={['1']}
                    items={[
                        {key: 1, label: "Scott's Dinner App Data List"}
                    ]}
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                />
            </Header>
            <Content
                style={{
                    padding: '0 48px'
                }}
            >
                <Breadcrumb
                    style={{
                        margin: '16px 0',
                    }}
                >
                    <Breadcrumb.Item>Meal Data</Breadcrumb.Item>
                    <Breadcrumb.Item>Management</Breadcrumb.Item>
                </Breadcrumb>
                <div
                    style={{
                        background: colorBgContainer,
                        padding: 24,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <ContainerCmp />
                </div>
            </Content>
            <Footer
                style={{
                    textAlign: 'center',
                }}
            >
                Scott's Dinner App Data Management ©{new Date().getFullYear()} Created by Olek
            </Footer>
        </Layout>
    );
};
export default LayoutCmp;