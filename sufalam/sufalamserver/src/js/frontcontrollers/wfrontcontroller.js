var clientDBOp = require('../db/clientDBOperations');
var path = require('path');

exports.wUploadImageFile = function(req,res){
    clientDBOp.dbUploadImageFile(req,res);
};

exports.wInsertProductInfo = function(req,res){
    clientDBOp.dbInsertProductInfo(req,res);
};

exports.wUpdateProductInfo = function(req,res){
    clientDBOp.dbUpdateProductInfo(req,res);
};

exports.wDeleteProduct = function(req,res){
    clientDBOp.dbDeleteProduct(req,res);
};

exports.wGetLatestProductInfo = function(req,res){
    clientDBOp.dbGetLatestProductInfo(req,res);
};

exports.wSearchProduct = function(req,res){
    clientDBOp.dbGetSearchProduct(req,res);
};

exports.wFilterProductOnDate = function(req,res){
    clientDBOp.dbFilterProductOnDate(req,res);
};

exports.wSortAscOrDesc = function(req,res){
    clientDBOp.dbSortAscOrDesc(req,res);
};

