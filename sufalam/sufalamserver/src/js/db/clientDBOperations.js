var db = require('./dbConnect');
var pool = db.getPool();
const bcrypt = require('bcryptjs');
var path = require("path");

var multer = require('multer');

var vLoggerModule = require('../vLogger');
const vLogger = vLoggerModule.getLogger();
const vMsgFormatter = vLoggerModule.formatMessage;
const {CVmhAdditionalLogInfo, startIndividualPerfParamCheck} = vLoggerModule;


var storage = multer.diskStorage({

    destination: function (req, file, cb) {
        let strProjectRootFullPath = path.join(__dirname, '../../../../'); 
        let strDeviceSoftwareDirFullPath = strProjectRootFullPath + "sufalamclient/src/Component/IMAGES";
        cb(null, strDeviceSoftwareDirFullPath)
        
    },

    filename: function (req, file, cb) {
        cb(null, new Date().getFullYear() +'' 
                        + (((new Date().getMonth()+1) < 10 ) ? 0 +'' +(new Date().getMonth()+1) : (new Date().getMonth()+1) ) +''
                        + ((new Date().getDate() < 10 ) ? 0 +'' +new Date().getDate() : new Date().getDate() ) +''
                        + ((new Date().getHours() < 10 ) ? 0 +'' +new Date().getHours() : new Date().getHours() ) +''
                        + ((new Date().getMinutes() < 10 ) ? 0 +'' +new Date().getMinutes() : new Date().getMinutes() ) +''
                        + ((new Date().getSeconds() < 10 ) ? 0 +'' +new Date().getSeconds() : new Date().getSeconds() ) +'_' 
                        + file.originalname)
    }
});

var upload = multer({ storage: storage }).single('ProductImage');

// const mathOperations = {
//     sum: function(a,b) {
//     return a + b;
// },

// module.exports =  


module.exports = {
    mathOperations: function(a,b) {
        return a + b;
    },

    dbUploadImageFile: function(req, res, err) {
        const STR_TAG_FUNC = "dbUploadImageFile";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        upload(req,res,function(err) {
            if(err) {
                strMsg = `Error while uploading image file.`;
                res.send({code: 'UPLOAD_ERROR', failuremessage: strMsg});
                vLogger.error(vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg));
                return; // No further processing required
            } else {
                strMsg = `Success while uploading image file.`;
                res.send({code: 'SUCCESS', successmessage: strMsg, uploadedFile: req.file});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }
        });
    },

    dbInsertProductInfo:function(req,res) {

        const STR_TAG_FUNC = "dbInsertProductInfo";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        let strMsg = '';
        let reqBody = req.body;
    
        if( reqBody == null ||
            ("ProductNameToSave" in reqBody) == false || 
            reqBody.ProductNameToSave == null || reqBody.ProductNameToSave.length <= 0  ||
            ("PricePerUnitToSave" in reqBody) == false || 
            reqBody.PricePerUnitToSave == null || reqBody.PricePerUnitToSave.length <= 0
        ) {
            strMsg = `Request JSON missing or Form does not contains Data.`;  
            res.send({code: 'REQ_PARAMS_MISSING', failuremessage: strMsg});
            vLogger.error( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
            return; // No further processing required
        }

        const ProductNameToSave = reqBody.ProductNameToSave;
        const PricePerUnitToSave = reqBody.PricePerUnitToSave;
        let FileName = reqBody["FileName"];
        let FilePath = reqBody["FilePath"];
    
        let sqlQuery = '';

        sqlQuery = `INSERT INTO sProducts(ProductName, ImageLocn, Image, PricePerUnitINR, LastModifiedTime)
                        VALUES('${ProductNameToSave}', '${FilePath}', '${FileName}', ${PricePerUnitToSave}, DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%d %H:%i:%S')
                    )`;

        pool.query(sqlQuery, function (err, result) {
            if (err) {
                strMsg = `Unable to Save Product Info in Database.`;
                res.send({code: 'SQL_ERROR', failuremessage: strMsg, sqlerrcode: err.code, errno: err.errno});
                vLogger.error( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg, err) );
                return;

            } else {
                strMsg = 'Product Info Saved Successfully.';
                res.send({code: 'SUCCESS', successmessage: strMsg, SaveProductCreationData: result});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }        
        });
    },

    dbUpdateProductInfo:function(req,res) {

        const STR_TAG_FUNC = "dbUpdateProductInfo";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        let strMsg = '';
        let reqBody = req.body;
    
        if( reqBody == null ||
            ("ProductNameToSave" in reqBody) == false || 
            reqBody.ProductNameToSave == null || reqBody.ProductNameToSave.length <= 0  ||
            ("PricePerUnitToSave" in reqBody) == false || 
            reqBody.PricePerUnitToSave == null || reqBody.PricePerUnitToSave.length <= 0
        ) {
            strMsg = `Request JSON missing or Form does not contains Data.`;  
            res.send({code: 'REQ_PARAMS_MISSING', failuremessage: strMsg});
            vLogger.error( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
            return; // No further processing required
        }

        const ProdCode = reqBody.ProdCode;
        const ProductNameToSave = reqBody.ProductNameToSave;
        const PricePerUnitToSave = reqBody.PricePerUnitToSave;
        let FileName = reqBody["FileName"];
        let FilePath = reqBody["FilePath"];

        let sqlQuery = '';

        sqlQuery = `Update sProducts
                    SET ProductName = '${ProductNameToSave}',
                        ImageLocn = '${FilePath}',
                        Image = '${FileName}',
                        PricePerUnitINR = ${PricePerUnitToSave}, 
                        LastModifiedTime = DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%d %H:%i:%S')
                    where ProductCode = ${ProdCode}`;

        pool.query(sqlQuery, function (err, result) {
            if (err) {
                strMsg = `Unable to Edit Product Info in Database.`;
                res.send({code: 'SQL_ERROR', failuremessage: strMsg, sqlerrcode: err.code, errno: err.errno});
                vLogger.error( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg, err) );
                return;

            } else {
                strMsg = 'Product Info Updated Successfully.';
                res.send({code: 'SUCCESS', successmessage: strMsg, SaveProductCreationData: result});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }        
        });
    },

    dbDeleteProduct:function(req,res) {

        const STR_TAG_FUNC = "dbDeleteProduct";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        let strMsg = '';
        let reqBody = req.body;
    
        if( reqBody == null ||
            ("ProdCode" in reqBody) == false || 
            reqBody.ProdCode == null || reqBody.ProdCode.length <= 0
        ) {
            strMsg = `Request JSON missing or Form does not contains Data.`;  
            res.send({code: 'REQ_PARAMS_MISSING', failuremessage: strMsg});
            vLogger.error( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
            return; // No further processing required
        }

        const ProdCode = reqBody.ProdCode;
    
        let sqlQuery = '';

        sqlQuery = `delete from sProducts
                    where ProductCode = ${ProdCode}`;

        pool.query(sqlQuery, function (err, result) {
            if (err) {
                strMsg = `Unable to Delete Product.`;
                res.send({code: 'SQL_ERROR', failuremessage: strMsg, sqlerrcode: err.code, errno: err.errno});
                vLogger.error( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg, err) );
                return;

            } else {
                strMsg = 'Product Deleted Saved Successfully.';
                res.send({code: 'SUCCESS', successmessage: strMsg, SaveProductCreationData: result});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }        
        });
    },

    dbGetLatestProductInfo: function (req, res) {

        const STR_TAG_FUNC = "dbGetLatestProductInfo";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        let strMsg = " ";
        let reqBody = req.body;

        let selectQuery = '';

        selectQuery = `select ProductCode, ProductName, PricePerUnitINR, Image, DATE_FORMAT(LastModifiedTime, '%Y-%m-%d %H:%i:%S') as ProdLastModifiedTime
                    from sProducts
                    order by ProdLastModifiedTime DESC`;
                    // where ProductName Like  '%${productName}%'`;
                                
        pool.query(selectQuery, function(err, result, fields) {
            if(err) {
                strMsg = `SQL Error while getting Product Table Details.`;
                res.send({code: 'SQL_ERROR', failuremessage: strMsg, sqlerrcode: err.code, errno: err.errno});
                vLogger.error(vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg, err));
                return; // No further processing required
            } else {
                strMsg = `Success while getting Product Table Details.`;
                res.send({code: 'SUCCESS', successmessage: strMsg, retrievedProductTableDetails: result});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }
        })
    },

    dbSortAscOrDesc: function (req, res) {

        const STR_TAG_FUNC = "dbFilterProductOnDate";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        let strMsg = " ";
        let reqBody = req.body;

        let selectQuery = '';

        let check = ("check" in reqBody) == true && reqBody["check"] != null && reqBody["check"].length > 0 ? reqBody["check"] : null;

        let strOrderBy = "";
        if((check != null && check == "asc")) {
            // strOrderBy = ` order by ProdLastModifiedTime DESC`;
            strOrderBy = ` order by ProdLastModifiedTime ASC`;
        } else {
            // strOrderBy = ` order by ProdLastModifiedTime ASC`;
            strOrderBy = ` order by ProdLastModifiedTime DESC`;
        }

        selectQuery = `select ProductCode, ProductName, PricePerUnitINR, Image, DATE_FORMAT(LastModifiedTime, '%Y-%m-%d %H:%i:%S') as ProdLastModifiedTime
                        from sProducts
                        ${strOrderBy}`;
                                
        pool.query(selectQuery, function(err, result, fields) {
            if(err) {
                strMsg = `SQL Error while sorting Product Table Details in Ascending Order.`;
                res.send({code: 'SQL_ERROR', failuremessage: strMsg, sqlerrcode: err.code, errno: err.errno});
                vLogger.error(vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg, err));
                return; // No further processing required
            } else {
                strMsg = `Success while sorting Product Table Details in Descending Order`;
                res.send({code: 'SUCCESS', successmessage: strMsg, retrievedProductTableDetails: result});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }
        })
    },

    dbFilterProductOnDate: function (req, res) {

        const STR_TAG_FUNC = "dbFilterProductOnDate";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        let strMsg = " ";
        let reqBody = req.body;

        let StartDtTm = ("startDate" in reqBody) == true && reqBody["startDate"] != null && reqBody["startDate"].length > 0 ? "'" + reqBody["startDate"] + "'" : null;
        let EndDtTm = ("endDate" in reqBody) == true && reqBody["endDate"] != null && reqBody["endDate"].length > 0 ? "'" + reqBody["endDate"] + "'" : null;
        
        let strWhereClauseStartDtTmAndEndDtTm = "";
        if((StartDtTm != null && StartDtTm.length > 0) && (EndDtTm != null && EndDtTm.length > 0)) {
            strWhereClauseStartDtTmAndEndDtTm = ` where LastModifiedTime between DATE_FORMAT(${StartDtTm}, '%Y-%m-%d %H:%i:%S') and DATE_FORMAT(${EndDtTm}, '%Y-%m-%d %H:%i:%S') `;
        } else {
            strWhereClauseStartDtTmAndEndDtTm = "";
        }

        let selectQuery = '';

        selectQuery = `select ProductCode, ProductName, PricePerUnitINR, Image, DATE_FORMAT(LastModifiedTime, '%Y-%m-%d %H:%i:%S') as ProdLastModifiedTime
                        from sProducts
                        ${strWhereClauseStartDtTmAndEndDtTm}`;
                                
        pool.query(selectQuery, function(err, result, fields) {
            if(err) {
                strMsg = `SQL Error while getting Product Table Details on filtering.`;
                res.send({code: 'SQL_ERROR', failuremessage: strMsg, sqlerrcode: err.code, errno: err.errno});
                vLogger.error(vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg, err));
                return; // No further processing required
            } else {
                strMsg = `Success while getting Product Table Details on filtering.`;
                res.send({code: 'SUCCESS', successmessage: strMsg, retrievedProductTableDetails: result});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }
        })
    },

    dbGetSearchProduct: function (req, res) {

        const STR_TAG_FUNC = "dbGetSearchProduct";
        const objAdditionalLogInfo = new CVmhAdditionalLogInfo({OrgReqObj: req, TagFunction: STR_TAG_FUNC});

        let strMsg = " ";
        let reqBody = req.body;

        let productName = ("productName" in reqBody) == true && reqBody["productName"] != null && reqBody["productName"].length > 0 ? reqBody["productName"] : null;

        let selectQuery = `select ProductCode, ProductName, PricePerUnitINR, Image, DATE_FORMAT(LastModifiedTime, '%Y-%m-%d %H:%i:%S') as ProdLastModifiedTime
                            from sProducts
                            where ProductName Like  '%${productName}%'`;
        
        pool.query(selectQuery, function(err, result, fields) {
            if(err) {
                strMsg = `SQL Error while searching Product.`;
                res.send({code: 'SQL_ERROR', failuremessage: strMsg, sqlerrcode: err.code, errno: err.errno});
                vLogger.error(vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg, err));
                return; // No further processing required
            } else {
                strMsg = `Success while searching Product.`;
                res.send({code: 'SUCCESS', successmessage: strMsg, retrievedSearchedProductDetails: result});
                vLogger.info( vMsgFormatter(objAdditionalLogInfo, STR_TAG_FUNC, strMsg) );
                return; // No further processing required
            }
        })
    },
}