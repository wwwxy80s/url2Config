// @ts-nocheck

import React, {Fragment, useState} from "react";
import {Upload, message, Button, Divider} from "antd";
import {InboxOutlined, DownloadOutlined} from '@ant-design/icons'
import lodash from "lodash";
import YAML from "json-to-pretty-yaml";
import "antd/dist/antd.css";

import "./index.css";
import jsonObj from "./template";

const {Dragger} = Upload;

// 匹配除所有诸如 ss://BASE64-ENCODED-STRING-WITHOUT-PADDING#TAG 之类的格式
const ssUrlReg1 = /^(ss:\/\/)((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)(#(.*))?$/gm;
const ssUrlReg2 = /^(ss:\/\/)((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)(#(.*))?$/;
// 匹配 method:password@hostname:port
const ssUrlReg3 = /^(.*?):(.*)@(.*):(.*)$/;
// 匹配 fileName.xxx
const fileNameReg = /^(.*)\.(.*)/;

const App = () => {
    const [fileList, setFileList] = useState([]);
    const props = {
        action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
        multiple: true,
        fileList,
        showUploadList: {
            showPreviewIcon: true,
            showRemoveIcon: false,
            showDownloadIcon: false
        },
        // transformFile(file) {
        //   const fileReader = new FileReader();
        //   fileReader.onload = () => {
        //     const matchArr = fileReader.result.match(ssUrlReg1);
        //   };
        //   fileReader.readAsText(file);
        //   return file;
        // },
        onChange: (info) => {
            // console.log(info);
            const {status} = info.file;
            // if (status !== "uploading") {
            //   // console.log(info.file, info.fileList);
            // }
            let newFileList = [...info.fileList];
            if (status === "done") {
                // console.log("setFileList", info.fileList);
                message.success(`${info.file.name} 上传成功`);
            } else if (status === "error") {
                newFileList = [...fileList];
                message.error(`${info.file.name} 上传失败`);
            } else if (status === "uploading") {
                console.log(status);
            } else {
                newFileList = [...fileList];
            }
            setFileList(newFileList);
        },
        beforeUpload: file => {
            if (fileList.some(indexFile => indexFile.name === file.name)) {
                console.log("already uploaded!");
                message.success(`${file.name} 已上传，不可重复上传`);
                return false;
            }
        }
    };

    const onButtonClick = () => {
        console.log(fileList);
        for (const file of fileList) {
            const templateObj = lodash.cloneDeep(jsonObj);
            const {name, originFileObj} = file;
            const match = name.match(fileNameReg);
            // 最终生成的文件名
            const fileName = `${match[1]}.yaml`;
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const ssUrlMatchedArr = fileReader.result.match(ssUrlReg1);
                // console.log(ssUrlMatchedArr);
                const proxies = [];
                const Proxy = [];
                let i = 1;
                if (Array.isArray(ssUrlMatchedArr)){
                    for (const ssUrl of ssUrlMatchedArr) {
                        // console.log(ssUrl);
                        const matchArr = ssUrl.match(ssUrlReg2);
                        // console.log(matchArr);
                        const base64Str = matchArr[2];
                        const serverName = matchArr[4] || `ss${i++}`;
                        if (proxies.some(name => name === serverName)) {
                            continue;
                        }
                        const decodedBase64Str = atob(base64Str);
                        const decodedBase64StrMatchArr = decodedBase64Str.match(ssUrlReg3);
                        // console.log(decodedBase64StrMatchArr);
                        const ssServerObj = {
                            name: serverName,
                            type: "ss",
                            server: decodedBase64StrMatchArr[3],
                            port: decodedBase64StrMatchArr[4],
                            cipher: decodedBase64StrMatchArr[1],
                            password: decodedBase64StrMatchArr[2]
                        };
                        proxies.push(serverName);
                        Proxy.push(ssServerObj);
                    }
                    templateObj.proxies = Proxy;
                    templateObj["proxy-groups"][0].proxies = proxies;
                    const yamlStr = YAML.stringify(templateObj);

                    // 根据对应文件内容和文件名生成下载链接
                    const link = document.createElement("a");
                    const blob = new Blob([yamlStr]);
                    link.href = window.URL.createObjectURL(blob);
                    link.download = fileName;
                    link.click();
                    window.URL.revokeObjectURL(blob);
                }

            };
            fileReader.readAsText(originFileObj);
        }
    };
    return (
        <Fragment>
            <h1>SS BASE64 encoded URI转clash yaml配置文件</h1>
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined/>
                </p>
                <p className="ant-upload-text">单击或拖动文件到该区域以上传</p>
                <p className="ant-upload-hint">
                    支持单个文件或者多个文件，每个文件生成单独的config文件
                </p>
            </Dragger>
            <Divider/>
            <Button
                type="primary"
                icon={<DownloadOutlined/>}
                block
                onClick={onButtonClick}
                disabled={!fileList.length}
            >
                全部下载
            </Button>
        </Fragment>
    );
};

export default App;
