const wroutes = require('express').Router();
const wfrontcontroller = require('../frontcontrollers/wfrontcontroller');
const path = require('path');


wroutes.post('/wclient/uploadImageFile', wfrontcontroller.wUploadImageFile);

wroutes.post('/wclient/insertProductInfo',wfrontcontroller.wInsertProductInfo);

wroutes.post('/wclient/updateProductInfo',wfrontcontroller.wUpdateProductInfo);

wroutes.post('/wclient/deleteProduct',wfrontcontroller.wDeleteProduct);

wroutes.post('/wclient/getLatestProductInfo',wfrontcontroller.wGetLatestProductInfo);

wroutes.post('/wclient/searchProduct',wfrontcontroller.wSearchProduct);

wroutes.post('/wclient/filterProductOnDate',wfrontcontroller.wFilterProductOnDate);

wroutes.post('/wclient/sortAscOrDesc',wfrontcontroller.wSortAscOrDesc);

module.exports = wroutes;