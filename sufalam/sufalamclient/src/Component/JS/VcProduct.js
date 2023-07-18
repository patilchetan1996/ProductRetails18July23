import React, { useState, useEffect, useContext } from 'react';
import {useTable,  useBlockLayout, useResizeColumns, usePagination, useSortBy, useFilters}  from 'react-table';
import { getAPIHostURL } from '../../ClientConfig';
import axios from 'axios';
import { Modal, ModalHeader, ModalBody} from 'reactstrap';
import { convertUTCDateStringToLocalDateWithFormatDDMMMYYHH24MISS, convertLocalDateToDisplayToday, convertUTCDateToStrYYYYMMDDHH24MMSS,
         convertLocalDateToStrYYYYMMDDHH24MMSS} from '../../vtUtil';
import { FaSearch, FaEdit } from 'react-icons/fa';
import { IoTrashBin } from "react-icons/io5";
import { trimStringAndRemoveTrailingComma } from '../../vtUtil';
import '../CSS/ReactTable.css';
import DateTimePicker from 'react-datetime-picker';

// Define a default UI for filtering
function DefaultColumnFilter({
    column: { filterValue, preFilteredRows, setFilter },
  }) {
    const count = preFilteredRows.length
  
    return (
        <div style={{textOverflow: "ellipsis",whiteSpace: "nowrap", paddingLeft: "0.1rem", paddingRight: "0.3rem"}}>
            <FaSearch style={{marginRight:"0.3rem",color:"var(--secondaryColor)", fontSize:"1rem"}}/>
            <input
                 value={filterValue || ''}
                     onChange={e => {
                       setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
                     }}
                     placeholder={"Search"}
                     style={{fontSize:"0.8rem",width: "85%", height:"100%", padding: "0.3rem", border:"1px solid rgba(0,0,0,.1)"}}
            />
        </div>
    );
}

// Create a default prop getter
const defaultPropGetter = () => ({});

const ReactTable = ({ columns, data, getCellProps = defaultPropGetter, passedStateVariable }) => {

    // Allows overriding or adding additional filter types for columns to use
    const filterTypes = React.useMemo(
        () => ({
          text: (rows, id, filterValue) => {
            return rows.filter(row => {
              const rowValue = row.values[id]
              return rowValue !== undefined
                ? String(rowValue)
                    .toLowerCase()
                    .startsWith(String(filterValue).toLowerCase())
                : true
            })
          },
        }),
        []
    );

    // This is particularly useful for adding global column properties.
    const defaultColumn = React.useMemo(
        () => ({
          minWidth: 30,
          width: 150,
          Filter: DefaultColumnFilter,
          canFilter: true,
        }),
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        prepareRow,
        state: { pageIndex, pageSize},
        getRowProps = defaultPropGetter,
    } = useTable(
        {
            columns,
            data,
            defaultColumn,
            // set page size based on tables
            initialState: {pageSize: 5},
            filterTypes,
        },
        useBlockLayout,
        useResizeColumns,
        useFilters,
        useSortBy,
        usePagination,
    );

    // if the state.goToPage1 is true and if new data is inserted
    // go to page 1
    React.useEffect(() =>{
        if(passedStateVariable == true){
            gotoPage(0)
        }
    },[passedStateVariable]);

    //uses the table header group props for the empty rows so resizing and flex layout still works
    const createEmptyRow = (NoData=false) => {
        return(
            <tr className = "tr"
                style= {{
                    textAlign:"left",
                    paddingLeft: "1rem",
                    textOverflow: "ellipsis", 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    height: "2.6rem"
                }}
            >
                <td className = "td"
                >
                    {NoData == true?
                    <div><span>&nbsp;No Product Details Found.</span></div>
                    :
                    <div><span>&nbsp;</span></div>
                    }
                </td>
            </tr>
                
        )
    };

    //creating empty padding cells
    const getEmptyRow = () => {
        let emptyRows = [];

        if(page.length%pageSize !== 0 && !canNextPage){
            for (let i = 0; i < (pageSize - page.length%pageSize); i++){
                emptyRows.push(createEmptyRow(false));
            }
        }

        if(data.length === 0 || page.length === 0){
            for (let i = 0; i < pageSize; i++){
                // emptyRows.push(createEmptyRow());
                if(i == 0){
                    emptyRows.push(createEmptyRow(true));
                } else{
                emptyRows.push(createEmptyRow(false));
                }
            }
        }

        return emptyRows
    };
    
    return (
        <div>
            <div className='tableWrap'> 
                <table  {...getTableProps()}  style={{overflow:'auto'}} >
                    <thead>
                        {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()} className="trForHeader" >
                            {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps(column.getSortByToggleProps())} className="tdForHeader">
                                <div className='Header'>
                                    {column.render('Header') }
                                <div className='fa' >
                                    {column.isSorted
                                    ? column.isSortedDesc
                                        ? ' 🔽'
                                        : ' 🔼'
                                    : ''}
                                </div>
                                </div>
                                <div
                                    {...column.getResizerProps()}
                                    className={`resizer ${
                                        column.isResizing ? 'isResizing' : ''
                                    }`}
                                    // to stop other clicking events when resizing
                                    onClick={(event)=> event.stopPropagation()}
                                />
                            </th>
                            ))}
                        </tr>
                        ))}
                    </thead>

                    <thead >
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}  className="trforSearchField">
                                {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps()} className="tdForSearchField">
                                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                                </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody {...getTableBodyProps()} >
                        {page.map((row, i) => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps(getRowProps(row))}
                                    className = "tr"   
                                    style={{
                                        cursor: '',
                                        background: '',
                                        color: 'black',
                                        alignItems: "center",
                                    }}  
                                >
                                    {row.cells.map(cell => {
                                    return <td {...cell.getCellProps(
                                        [
                                            {style: cell.column.style},
                                            getCellProps(cell),
                                        ]
                                    )} className="td" 
                                    // onClick = {() =>{ 
                                    //                     // onEditProductDetails(row, cell.column);
                                    //                     onEditProductDetails(row, 1);
                                    //         }}
                                    >{cell.render("Cell")}</td>;
                                    })}
                                </tr>
                            );
                        }) 
                        }
                        {getEmptyRow()}
                    </tbody>
                </table>
            </div>
            <div>
                <div>
                    <div class="-pagination">
                        <div class="-previous">
                            <button onClick={() => previousPage()} type="button" disabled={!canPreviousPage} class="-btn">Prev</button>
                        </div>
                        <div class="-center">
                            <span class="-pageInfo">
                                Page {" "}    
                                <div class="-pageJump">
                                    <input 
                                        value={pageIndex + 1} 
                                        onChange={e => {
                                            const page = e.target.value ? Number(e.target.value) - 1 : 0
                                            gotoPage(page)
                                        }}
                                        aria-label="jump to page" type="number"
                                    />
                                </div>
                                of {" "}  
                                <span class="-totalPages">{pageOptions.length}</span>
                            </span>
                            <span class="select-wrap -pageSizeOptions">
                                <select aria-label="rows per page"
                                    style={{padding:"0.2rem"}}
                                    value={pageSize}
                                    onChange={e => {
                                    setPageSize(Number(e.target.value))
                                }}>
                                    {[5, 10, 20, 25, 100].map(pageSize => (
                                        <option key={pageSize} value={pageSize}>
                                        {pageSize} rows
                                        </option>
                                    ))}
                                </select>
                            </span>  
                        </div>
                        <div class="-next">
                            <button onClick={() => nextPage()} type="button" disabled={!canNextPage} class="-btn">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function VcProduct (props) {
    const searchStringStyle = {fontSize: "0.8rem", width:"85%"};
    const filterCaseInsensitive = (rows, id, filterValue) => {

        if(id != "lastModifiedTime") {
            return rows.filter(row => {
                const rowValue = row.values[id]
                return rowValue !== undefined
                    ? String(rowValue.toString().toLowerCase()).includes(filterValue.toLowerCase())
                    : false
                })
        } else {
            return rows.filter(row => {
                let splittedStr = row.values[id].split(" ");
                const rowValue = row.values[id]

                if(String("Today".toString().toLowerCase()).includes(filterValue.toLowerCase()) &&
                            new Date(rowValue).getDate().toString().toLowerCase() == new Date().getDate().toString().toLowerCase() &&
                            new Date(rowValue).getMonth().toString().toLowerCase() == new Date().getMonth().toString().toLowerCase() &&
                            new Date(rowValue).getFullYear().toString().toLowerCase() == new Date().getFullYear().toString().toLowerCase()
                ) {
                    // Only for the case where the string entered in the filter box is present in cell
                    // then show all the rows which includes the input string in the final result (by returning true)
                    // It will return only those rows which contains a current date.                
                    return true;
                } else if(new Date(rowValue).getDate().toString().toLowerCase() == new Date().getDate().toString().toLowerCase() &&
                            new Date(rowValue).getMonth().toString().toLowerCase() == new Date().getMonth().toString().toLowerCase() &&
                            new Date(rowValue).getFullYear().toString().toLowerCase() == new Date().getFullYear().toString().toLowerCase() &&
                            String(splittedStr[1].toString().toLowerCase()).includes(filterValue.toString().toLowerCase()) ) {
                    // only for A "Today" case where Searching will always happens in a Time String.
                    return true;
                } else if(new Date(rowValue).getDate().toString().toLowerCase() == new Date().getDate().toString().toLowerCase() &&
                            new Date(rowValue).getMonth().toString().toLowerCase() == new Date().getMonth().toString().toLowerCase() &&
                            new Date(rowValue).getFullYear().toString().toLowerCase() == new Date().getFullYear().toString().toLowerCase()
                ) {
                    // It will return only those rows which should not contains a current date.
                    return false;
                }
                    else {
                    return String(rowValue.toString().toLowerCase()).includes(filterValue.toLowerCase())
                }
            })
        }
    };

    const onEditProductDetails = (rowInfo, column) => {

        let modifiedState = state;
        modifiedState.formViewMode = "editMode";

        modifiedState.ProductCode = rowInfo.original.ProductCode;
        modifiedState.selectedProductName = rowInfo.original.selectedProductName;
        
        
        modifiedState.PricePerUnit = rowInfo.original.PricePerUnit;
        modifiedState.originalImagePath = rowInfo.original.Image;

        modifiedState.lastModifiedTime = rowInfo.original.lastModifiedTime;

        modifiedState.originalProductCode = rowInfo.original.ProductCode;
        modifiedState.originalProductName =rowInfo.original.selectedProductName;
        modifiedState.originalPricePerUnitINR = rowInfo.original.PricePerUnit;
        modifiedState.Image = rowInfo.original.Image;

        modifiedState.modal = true;
        setState({...modifiedState});
    }

    const deleteProduct = (rowInfo, column) => {

        let modifiedState = state;
        modifiedState.formViewMode = "";
        
        modifiedState.originalProductCode = rowInfo.original.ProductCode;
        modifiedState.originalProductName =rowInfo.original.selectedProductName;
        
        let JsonBody = {
            ProdCode: modifiedState.originalProductCode,
        }

        axios.post(`${getAPIHostURL()}/wclient/deleteProduct`, JsonBody)
        .then(response => {
            if(response.data.code == "SUCCESS") {
                alert(`Successfully 'deleted' selected Product with Product ID '${modifiedState.originalProductCode}' and Product Name '${modifiedState.originalProductName}'.`);
                
                modifiedState.modal = false;
                getLatestProductInfo(modifiedState)

                modifiedState.errors.others = "";
                modifiedState.PricePerUnit = "";

            } else {
                if (response.data.code == 'SQL_ERROR') {
                    console.log("SQL Error while Saving Product Info.")
                    modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                } else {
                    if (response.data.code == 'REQ_PARAMS_MISSING') {
                        console.log("Request Parameters missing while Saving Product Info.")                      
                        modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                    } else {
                        console.log("Should not reach here.")
                        modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                    }
                }
            }
            setState({...modifiedState});
        })
        .catch(error => {
            console.log(error);
            if (axios.isCancel(error)) {
                console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
            } else {
                modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
            //   modifiedState.errors.others = t(IDS_RegistNetworkError);
            setState({...modifiedState});
        } 
        });

        // modifiedState.modal = true;
        setState({...modifiedState});
    }

    const [state, setState] = useState({
        modal: false,
        backdrop: 'static',

        errors: {
            others: "",
            ProdName: "", 
            PricePerUnit: "",
            fileUpload:"",
            timeRelatedErr: "",
        },
        ProductNameCodeAndProductNameArr: [],
        ProdNameArr: [],
        PricePerUnit: "",
        goToPage1: false,

        selectedProductName: "",
        originalImagePath: "",
        lastModifiedTime: "",
        LoggedInUserID: "",
        showModal: false,

        formViewMode: "",
        LastModifiedUtcDtTmOfReceivedProductData: "",
        data: [],

        ProductCode: "",
        QuantityInStock: "",
        SetByUser: "",
        ProdLastModifiedTime: "",

        originalProductCode: "",
        originalProductName: "",
        originalPricePerUnitINR: "",
        originalImagePath: "",
        Image: "",
        noDataFound: "",
        showModal: false,
        combinedAllUploadedFileName: [],
        filesToSendToBucket : [],
        fileToUploadFullData: [],
        fileToUploadFullPath: null,
        StartDateTime: new Date(new Date().setHours(new Date().getHours() - 24)),
        EndDateTime: new Date(),
        startDate: '',
        endDate: '',
        showRefreshBtn: false,
        showClearBtn: false,
        startDateSelected: false,
        endDateSelected: false,
        startDateLength: 0,
        endDateLength: 0, 
        areDatesSelected: false,
        productName: "",
        columns: [
            {   
                Header:() => <div className="ProductTableHeader">Edit</div>, 
                accessor: "edit",
                width: 80,
                style:({
                    textAlign:"center",
                    paddingLeft: "1rem",
                    textOverflow: "ellipsis", 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    height: "2.6rem"
                }),
                disableFilters: true,
                filter: filterCaseInsensitive,
            },
            {   
                Header:() => <div className="ProductTableHeader">Delete</div>, 
                accessor: "delete",
                width: 80,
                style:({
                    textAlign:"center",
                    paddingLeft: "1rem",
                    textOverflow: "ellipsis", 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    height: "2.6rem"
                }),
                disableFilters: true,
                filter: filterCaseInsensitive,
            },
            {       
                Header:() => <div className="ProductTableHeader">Product Name</div>,
                accessor: 'selectedProductName',
                width: 210,
                style:({
                    textAlign:"left",
                    paddingLeft: "1rem",
                    textOverflow: "ellipsis", 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    height: "2.6rem"
                }),
                filter: filterCaseInsensitive,
            }, 
            {       
                Header:() => <div className="ProductTableHeader">Image</div>,
                Cell: ({ cell: { value }}) => (
                    value != null ? 
                        <img
                            src={require("../../../../sufalamclient/src/Component/IMAGES/" + `${value}`)}
                            alt={value}
                        />
                    :   
                        <div>
                            Image not Found
                        </div>
                ),
                accessor: 'Image',
                width: 760,
                style:({
                    textAlign:"left",
                    paddingLeft: "1rem",
                    textOverflow: "ellipsis", 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                }),
                disableFilters: true,
                // filter: filterCaseInsensitive,
            },
            {       
                Header:() => <div className="ProductTableHeader">Price</div>,
                accessor: 'PricePerUnit',
                width: 120,
                style:({
                    textAlign:"center",
                    paddingLeft: "1rem",
                    textOverflow: "ellipsis", 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    height: "2.6rem"
                }),
                filter: filterCaseInsensitive,
            },   
            { 
                Header:() => <div className="ProductTableHeader">Creation Date</div>, 
                accessor: 'lastModifiedTime',
                Cell: (props) => getCustomizedTodaysDate(props.value),
                sortType: (firstRow, secondRow) => {
                        firstRow = new Date(firstRow).getTime();
                        secondRow = new Date(secondRow).getTime();
                        return secondRow > firstRow ? 1 : -1;
                    },
                width:190,
                sortType:({
                    textAlign:"left",
                    paddingLeft: "1rem",
                    textOverflow: "ellipsis", 
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    height: "2.6rem"
                }),
                filter: filterCaseInsensitive,
            },                    
        ],
    });

    const getCustomizedTodaysDate = (inLogTime) => {

        let strLocaleDateTimeToBeDisplayed = convertLocalDateToDisplayToday(inLogTime);
        let splittedDate = strLocaleDateTimeToBeDisplayed.split(" ");

        if(splittedDate[0].toLowerCase() == "Today,".toLowerCase()) {
            return "Today, " + splittedDate[1];
        } else {
            return strLocaleDateTimeToBeDisplayed;
        }
    }

    const onChangeStartDate = (updatedStartDt) => {
        let modifiedState = state;
        let currentDate = new Date();

        if(updatedStartDt > currentDate) {
            modifiedState.errors.timeRelatedErr = "Start Date can not be greater than Current Date. It will be set to Current Date.";
            modifiedState.startDate = currentDate;
            modifiedState.endDate = currentDate;

            if(modifiedState.endDate != null && modifiedState.endDate.toString().length > 0 && updatedStartDt > modifiedState.endDate) {
                modifiedState.errors.timeRelatedErr = "End Date can not be less than Start Date. It will be set same as to Start Date.";
                modifiedState.startDate = updatedStartDt;
                modifiedState.endDate = updatedStartDt;
            }
        } else if(modifiedState.endDate != null && modifiedState.endDate.toString().length > 0 && updatedStartDt > modifiedState.endDate) {
            modifiedState.errors.timeRelatedErr = "End Date can not be less than Start Date. It will be set same as to Start Date.";
            modifiedState.startDate = updatedStartDt;
            modifiedState.endDate = updatedStartDt;
        } else {
            modifiedState.errors.timeRelatedErr = "";
            modifiedState.startDate = updatedStartDt;
        }

        modifiedState.startDateLength = modifiedState.startDate.toString().length;
        modifiedState.endDateLength = modifiedState.endDate.toString().length;

        if(modifiedState.startDateLength != null && modifiedState.startDateLength > 0){
            modifiedState.startDateSelected = true;
        }

        if(modifiedState.startDateLength > 0 && modifiedState.endDateLength > 0){
            modifiedState.showRefreshBtn = true;
        }

        if(modifiedState.startDateLength > 0 || modifiedState.endDateLength > 0){
            modifiedState.showClearBtn = true;
        }

        setState({...modifiedState});
    }

    const onChangeEndDate = (updatedEndDt) => {
        let modifiedState = state;
        let currentDate = new Date();

        if(updatedEndDt > currentDate) {
            modifiedState.errors.timeRelatedErr = "End Date can not be greater than Current Date. It will be set to Current Date.";
            modifiedState.endDate = currentDate;

        } else if(updatedEndDt < modifiedState.startDate) {
            modifiedState.errors.timeRelatedErr = "Start Date can not be greater than End Date. It will be set as same to End Date.";
            modifiedState.startDate = updatedEndDt;
            modifiedState.endDate = updatedEndDt;

        } else {
            modifiedState.errors.timeRelatedErr = "";
            modifiedState.endDate = updatedEndDt;
        }

        modifiedState.startDateLength = modifiedState.startDate.toString().length;
        modifiedState.endDateLength = modifiedState.endDate.toString().length;

        if(modifiedState.endDateLength != null && modifiedState.endDateLength > 0){
            modifiedState.endDateSelected = true;
        }

        if(modifiedState.startDateLength > 0 && modifiedState.endDateLength > 0){
            modifiedState.showRefreshBtn = true;
        }

        if(modifiedState.startDateLength > 0 || modifiedState.endDateLength > 0){
            modifiedState.showClearBtn = true;
        }

        setState({...modifiedState});
    }

    const clearDates = () => {

        let modifiedState = state;

        if(modifiedState.startDate != null && modifiedState.startDate.toString().length > 0){
            modifiedState.startDate = '';
        }
        
        if(modifiedState.endDate != null && modifiedState.endDate.toString().length > 0){
            modifiedState.endDate = '';
        }

        modifiedState.showRefreshBtn = false;
        modifiedState.showClearBtn = false;
        modifiedState.startDateSelected = false;
        modifiedState.endDateSelected = false;
        modifiedState.errors.others = "";
        modifiedState.errors.timeRelatedErr = "";
        modifiedState.productName = "";

        getLatestProductInfo();

        setState({...modifiedState});
    }

    const refresh = () => {
        let modifiedState = state;
        modifiedState.arrStagewiseProdInventoryStatus = [];
        modifiedState.data = [];
        modifiedState.errors.others = "";
        modifiedState.errors.timeRelatedErr = "";
        modifiedState.errors.ProdName = "";
        modifiedState.areDatesSelected = true;

        // getLatestProductInfo();
        getProductOnDateFilter();
    }

    const handleChange = (event) => {
        event.preventDefault();
        const { name, value } = event.target;
        let errors = state.errors;
      
        switch (name) {

            case 'productName': 
                errors.requiredFiled = ""       
            break;

            default:
            break;
        }

        setState({
            ...state,
            errors, 
            [name]: value,             
        });
    }

    const toggle = () => {
        let modifiedState = state;

        modifiedState.modal = !modifiedState.modal;
        modifiedState.ProductCode = "";
        modifiedState.selectedProductName = "";
        modifiedState.PricePerUnit = "";
       
        modifiedState.errors.ProductCode = "";
        modifiedState.errors.selectedProductName = "";
        modifiedState.errors.PricePerUnit = "";        
        modifiedState.errors.ProdName = "";
        modifiedState.errors.fileUpload = "";
        
        setState({...modifiedState});

    }

    useEffect(() =>{
        getLatestProductInfo();
    }, []);

    const getLatestProductInfo = (inModifiedState = null) => {
        
        let modifiedState;
        if(inModifiedState == null) {
            modifiedState = state;
        } else {
            modifiedState = inModifiedState;
        }
        
        console.log("modifiedState.formViewMode = ", modifiedState.formViewMode);

        modifiedState.goToPage1 = false;

        const jsonBody = {

        };

        axios.post(`${getAPIHostURL()}/wclient/getLatestProductInfo`, jsonBody)
        .then(response => {
            
            if(response.data.code == 'SUCCESS') {    

                if(response.data.retrievedProductTableDetails == null || response.data.retrievedProductTableDetails.length <= 0) {
                    // modifiedState.errors.others = "No Product Data Found.";
                } else {
                    let stateProductDetailsArr = [];
                    let stateProductLineDetailsArrForFechingData = []
                                            
                    stateProductDetailsArr = [...modifiedState.data]

                    const receivedProductData = response.data.retrievedProductTableDetails;

                    let editIcon = <FaEdit className="viewAndEditIcon" title="Edit"/>
                    let deleteIcon = <IoTrashBin className="viewAndEditIcon" title="Delete"/>
                    
                    for(let i = 0; i < receivedProductData.length; i++) {
                        const productDetails = receivedProductData[i];
                        let ProductlastModifiedLocaleDateTime = convertUTCDateStringToLocalDateWithFormatDDMMMYYHH24MISS(productDetails.ProdLastModifiedTime);
                        let singleProductDetails = {
                            edit: editIcon,
                            delete: deleteIcon,
                            ProductCode: productDetails.ProductCode == "null" ? "" : productDetails.ProductCode,
                            selectedProductName: productDetails.ProductName == "null" ? "" : productDetails.ProductName,
                            PricePerUnit: productDetails.ProductName == "null" ? "" : productDetails.PricePerUnitINR,
                            Image: productDetails.Image == "null" ? "" : productDetails.Image,
                            lastModifiedTime: ProductlastModifiedLocaleDateTime,
                            lastModifiedUtcDtTm : productDetails.LastModifiedUtcDtTm == "null" ? "" : productDetails.LastModifiedUtcDtTm,
                        };

                        //if form is open in insertMode(create new Product) then just add new retrieved data(new added Product details) at top of the Product table.
                        if(modifiedState.formViewMode == "insertMode"){
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = true;
                        } else if(modifiedState.formViewMode == "editMode"){
                            for(let j = 0; j <stateProductDetailsArr.length; j++){
                                if(stateProductDetailsArr[j].ProductCode == singleProductDetails.ProductCode){
                                    stateProductDetailsArr.splice(j, 1);
                                }
                            }
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        } else { 
                            stateProductLineDetailsArrForFechingData.push(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        }
                    } 

                    if(modifiedState.formViewMode == "insertMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else if(modifiedState.formViewMode == "editMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else {
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductLineDetailsArrForFechingData[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductLineDetailsArrForFechingData;
                    }
                    
                }
            } else {
                if(response.data.code == 'SQL_ERROR') {
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                } else {
                    console.log('Should not reach here');
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                }
            }
            setState({...modifiedState});
        })
        .catch(error => {
            console.log(error);
            console.log("Network error:");
            if (axios.isCancel(error)) {
                console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
            } else {
                modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                setState({...modifiedState});
            }
        })
    }

    const sortAscOrDesc = (inCheck) => {
        
        let modifiedState = state;
        
        let check;
        if(inCheck == null) {
            check = inCheck;
        } else {
            check = inCheck;
        }

        modifiedState.goToPage1 = false;

        const jsonBody = {
            check: check
        };

        axios.post(`${getAPIHostURL()}/wclient/sortAscOrDesc`, jsonBody)
        .then(response => {
            
            if(response.data.code == 'SUCCESS') {    

                if(response.data.retrievedProductTableDetails == null || response.data.retrievedProductTableDetails.length <= 0) {
                    // modifiedState.errors.others = "No Product Data Found.";
                } else {
                    let stateProductDetailsArr = [];
                    let stateProductLineDetailsArrForFechingData = []
                                            
                    stateProductDetailsArr = [...modifiedState.data]

                    const receivedProductData = response.data.retrievedProductTableDetails;

                    let editIcon = <FaEdit className="viewAndEditIcon" title="Edit"/>
                    let deleteIcon = <IoTrashBin className="viewAndEditIcon" title="Delete"/>
                    
                    for(let i = 0; i < receivedProductData.length; i++) {
                        const productDetails = receivedProductData[i];
                        let ProductlastModifiedLocaleDateTime = convertUTCDateStringToLocalDateWithFormatDDMMMYYHH24MISS(productDetails.ProdLastModifiedTime);
                        let singleProductDetails = {
                            edit: editIcon,
                            delete: deleteIcon,
                            ProductCode: productDetails.ProductCode == "null" ? "" : productDetails.ProductCode,
                            selectedProductName: productDetails.ProductName == "null" ? "" : productDetails.ProductName,
                            PricePerUnit: productDetails.ProductName == "null" ? "" : productDetails.PricePerUnitINR,
                            Image: productDetails.Image == "null" ? "" : productDetails.Image,
                            lastModifiedTime: ProductlastModifiedLocaleDateTime,
                            lastModifiedUtcDtTm : productDetails.LastModifiedUtcDtTm == "null" ? "" : productDetails.LastModifiedUtcDtTm,
                        };

                        //if form is open in insertMode(create new Product) then just add new retrieved data(new added Product details) at top of the Product table.
                        if(modifiedState.formViewMode == "insertMode"){
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = true;
                        } else if(modifiedState.formViewMode == "editMode"){
                            for(let j = 0; j <stateProductDetailsArr.length; j++){
                                if(stateProductDetailsArr[j].ProductCode == singleProductDetails.ProductCode){
                                    stateProductDetailsArr.splice(j, 1);
                                }
                            }
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        } else { 
                            stateProductLineDetailsArrForFechingData.push(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        }
                    } 

                    if(modifiedState.formViewMode == "insertMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else if(modifiedState.formViewMode == "editMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else {
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductLineDetailsArrForFechingData[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductLineDetailsArrForFechingData;
                    }
                    
                }
            } else {
                if(response.data.code == 'SQL_ERROR') {
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                } else {
                    console.log('Should not reach here');
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                }
            }
            setState({...modifiedState});
        })
        .catch(error => {
            console.log(error);
            console.log("Network error:");
            if (axios.isCancel(error)) {
                console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
            } else {
                modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                setState({...modifiedState});
            }
        })
    }

    const getProductOnDateFilter = (inModifiedState = null) => {
        
        let modifiedState;
        if(inModifiedState == null) {
            modifiedState = state;
        } else {
            modifiedState = inModifiedState;
        }

        let UtcStartDtTm = null;
        let UtcEndDtTm = null;

        let tempStart = modifiedState.startDate.toString();
        let tempEnd = modifiedState.endDate.toString();

        if((tempStart != null && tempStart.length > 0) && (tempEnd != null && tempEnd.length > 0)){   
            let strLoclStartDate = convertLocalDateToStrYYYYMMDDHH24MMSS(modifiedState.startDate);
            let strLoclEndDate = convertLocalDateToStrYYYYMMDDHH24MMSS(modifiedState.endDate);
    
            let strLoclStartDtTm = strLoclStartDate.split(" ")[0] + "T" + "00:00:00";
            let strLoclEndDtTm = strLoclEndDate.split(" ")[0] + "T" + "23:59:59";
      
            UtcStartDtTm = convertUTCDateToStrYYYYMMDDHH24MMSS(new Date(strLoclStartDtTm.valueOf()));
            UtcEndDtTm = convertUTCDateToStrYYYYMMDDHH24MMSS(new Date(strLoclEndDtTm.valueOf()));
        }

        modifiedState.goToPage1 = false;

        let LastModifiedUtcDtTmForInsertOrUpdateProdDetails;
       
        if(modifiedState.formViewMode == "editMode" || modifiedState.formViewMode == "insertMode"){
            LastModifiedUtcDtTmForInsertOrUpdateProdDetails = modifiedState.LastModifiedUtcDtTmOfReceivedProductData;
        } else {
            LastModifiedUtcDtTmForInsertOrUpdateProdDetails = null;
        }

        const jsonBody = {
            startDate: UtcStartDtTm,
            endDate: UtcEndDtTm,
        };

        axios.post(`${getAPIHostURL()}/wclient/filterProductOnDate`, jsonBody)
        .then(response => {
            
            if(response.data.code == 'SUCCESS') {    

                if(response.data.retrievedProductTableDetails == null || response.data.retrievedProductTableDetails.length <= 0) {
                    // modifiedState.errors.others = "No Product Data Found.";
                } else {
                    let stateProductDetailsArr = [];
                    let stateProductLineDetailsArrForFechingData = []
                                            
                    stateProductDetailsArr = [...modifiedState.data]

                    const receivedProductData = response.data.retrievedProductTableDetails;

                    let editIcon = <FaEdit className="viewAndEditIcon" title="Edit"/>
                    let deleteIcon = <IoTrashBin className="viewAndEditIcon" title="Delete"/>
                    
                    for(let i = 0; i < receivedProductData.length; i++) {
                        const productDetails = receivedProductData[i];
                        let ProductlastModifiedLocaleDateTime = convertUTCDateStringToLocalDateWithFormatDDMMMYYHH24MISS(productDetails.ProdLastModifiedTime);
                        let singleProductDetails = {
                            edit: editIcon,
                            delete: deleteIcon,
                            ProductCode: productDetails.ProductCode == "null" ? "" : productDetails.ProductCode,
                            selectedProductName: productDetails.ProductName == "null" ? "" : productDetails.ProductName,
                            PricePerUnit: productDetails.ProductName == "null" ? "" : productDetails.PricePerUnitINR,
                            Image: productDetails.Image == "null" ? "" : productDetails.Image,
                            lastModifiedTime: ProductlastModifiedLocaleDateTime,
                            lastModifiedUtcDtTm : productDetails.LastModifiedUtcDtTm == "null" ? "" : productDetails.LastModifiedUtcDtTm,
                        };

                        //if form is open in insertMode(create new Product) then just add new retrieved data(new added Product details) at top of the Product table.
                        if(modifiedState.formViewMode == "insertMode"){
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = true;
                        }
                        else if(modifiedState.formViewMode == "editMode"){
                            for(let j = 0; j <stateProductDetailsArr.length; j++){
                                if(stateProductDetailsArr[j].ProductCode == singleProductDetails.ProductCode){
                                    stateProductDetailsArr.splice(j, 1);
                                }
                            }
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        }    
                        else { 
                            stateProductLineDetailsArrForFechingData.push(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        }
                    } 

                    if(modifiedState.formViewMode == "insertMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else if(modifiedState.formViewMode == "editMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else {
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductLineDetailsArrForFechingData[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductLineDetailsArrForFechingData;
                    }
                    
                }
            } else {
                if(response.data.code == 'SQL_ERROR') {
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                } else {
                    console.log('Should not reach here');
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                }
            }
            setState({...modifiedState});
        })
        .catch(error => {
            console.log(error);
            console.log("Network error:");
            if (axios.isCancel(error)) {
                console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
            } else {
                modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                setState({...modifiedState});
            }
        })
    }

    const searchProduct = (inModifiedState = null) => {
        
        let modifiedState;
        if(inModifiedState == null) {
            modifiedState = state;
        } else {
            modifiedState = inModifiedState;
        }

        if(modifiedState.productName == null || modifiedState.productName.length <= 0){
            modifiedState.errors.ProdName = "Please enter Product Name for searching.";
        }

        const jsonBody = {
            productName: state.productName
        };

        axios.post(`${getAPIHostURL()}/wclient/searchProduct`, jsonBody)
        .then(response => {
            
            if(response.data.code == 'SUCCESS') {    

                if(response.data.retrievedSearchedProductDetails == null || response.data.retrievedSearchedProductDetails.length <= 0) {
                    modifiedState.errors.others = "No Product Data Found for the searched keyword.";
                } else {
                    let stateProductDetailsArr = [];
                    let stateProductLineDetailsArrForFechingData = []
                                            
                    stateProductDetailsArr = [...modifiedState.data]

                    const searchedProductData = response.data.retrievedSearchedProductDetails;
                    let editIcon = <FaEdit className="viewAndEditIcon" title="Edit"/>
                    
                    for(let i = 0; i < searchedProductData.length; i++) {
                        console.log("searchedProductData = ", searchedProductData[i]);
                        const productDetails = searchedProductData[i];
                        let ProductlastModifiedLocaleDateTime = convertUTCDateStringToLocalDateWithFormatDDMMMYYHH24MISS(productDetails.ProdLastModifiedTime);
                        let singleProductDetails = {
                            edit: editIcon,
                            ProductCode: productDetails.ProductCode == "null" ? "" : productDetails.ProductCode,
                            selectedProductName: productDetails.ProductName == "null" ? "" : productDetails.ProductName,
                            PricePerUnit: productDetails.ProductName == "null" ? "" : productDetails.PricePerUnitINR,
                            Image: productDetails.Image == "null" ? "" : productDetails.Image,
                            lastModifiedTime: ProductlastModifiedLocaleDateTime,
                            lastModifiedUtcDtTm : productDetails.LastModifiedUtcDtTm == "null" ? "" : productDetails.LastModifiedUtcDtTm,
                        };

                        //if form is open in insertMode(create new Product) then just add new retrieved data(new added Product details) at top of the Product table.
                        if(modifiedState.formViewMode == "insertMode"){
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = true;
                        }
                        else if(modifiedState.formViewMode == "editMode"){
                            for(let j = 0; j <stateProductDetailsArr.length; j++){
                                if(stateProductDetailsArr[j].ProductCode == singleProductDetails.ProductCode){
                                    stateProductDetailsArr.splice(j, 1);
                                }
                            }
                            stateProductDetailsArr.unshift(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        }    
                        else {
                            stateProductLineDetailsArrForFechingData.push(singleProductDetails);
                            modifiedState.goToPage1 = false;
                        }
                    } 

                    if(modifiedState.formViewMode == "insertMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else if(modifiedState.formViewMode == "editMode"){
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductDetailsArr[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductDetailsArr;
                    } else {
                        modifiedState.LastModifiedUtcDtTmOfReceivedProductData = stateProductLineDetailsArrForFechingData[0].lastModifiedUtcDtTm;
                        modifiedState.data = stateProductLineDetailsArrForFechingData;
                    }
                    
                }
            } else {
                if(response.data.code == 'SQL_ERROR') {
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                } else {
                    console.log('Should not reach here');
                    modifiedState.errors.others = 'Server experiencing issues.\nTry again later.';
                }
            }
            setState({...modifiedState});
        })
        .catch(error => {
            console.log(error);
            console.log("Network error:");
            if (axios.isCancel(error)) {
                console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
            } else {
                modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                setState({...modifiedState});
            }
        })
    }

// ========================================================================================================================
    // For opening Modal for creating new Product
    const openCreateProductModal = () => {

        let modifiedState = state; 
        modifiedState.formViewMode = "insertMode";

        modifiedState.modal = true;
        modifiedState.combinedAllUploadedFileName = [];
        modifiedState.filesToSendToBucket = [];

        setState({...modifiedState});
    }

    const onFileSelection = (e) => {
        console.log("onFileSelection Called");
        let modifiedState = state;
        // For getting path of selected file.
        let uploadedFilePath = e.target.value;
        modifiedState.errors.others = "";
        modifiedState.errors.fileUpload = "";

        // For getting all information about file.
        modifiedState.fileToUploadFullPath= e.target.files[0];
        

        // For fetching File's Name from File's Path.
        modifiedState.fileToUploadFileName = uploadedFilePath.split(/(\\|\/)/g).pop()
        setState(modifiedState);
    }

    const checkMimeType = (e) => {
        //getting file object
        let files = e.target.files;

        let isMimeTypeFromDeclaredType = false;
        let fileErrToSend = ""

        // list allow mime type
        const types = ['image/png', 'image/jpeg', 'image/gif', "image/bmp", "image/tiff"];

        for(var x = 0; x<files.length; x++) {
            // compare file type and see which file doesn't match then show the error message.
            if (types.every(type => files[x].type !== type)) { 
                fileErrToSend = `${(files[x].type == null || files[x].type.length <= 0) ? 'This' : 'The ' + "'" + files[x].type + "'"} is not a supported format.`;
            } else {
                fileErrToSend = "";
                isMimeTypeFromDeclaredType = true;
            }
        };
        return {isMimeTypeFromDeclaredType, fileErrToSend};
    }

    const OnChangeProductNameSelection = (e) => {

        let modifiedState = state;
        modifiedState.errors.ProdName = "";

        // modifiedState.ProdName = e.target.value;
        modifiedState.selectedProductName = e.target.value;

        for(let i=0; i< modifiedState.ProductNameCodeAndProductNameArr.length; i++) {
            if(modifiedState.ProductNameCodeAndProductNameArr[i].newProductName == modifiedState.selectedProductName) {
                // Assigning values to ProductNameCode DataList selection based on selection of ProductName DataList.
            }
        }

        setState({...modifiedState});
    }


    const onEnteredPricePerUnit = (e) => {
        
        e.target.value = e.target.value < 0 ? "" : e.target.value;
        let modifiedState = state;
        modifiedState.errors.PricePerUnit = "";
        modifiedState.PricePerUnit = e.target.value;
        setState({...modifiedState});
    }

    const closeModal = () => {
        toggle();
        state.errors.ProdName = "";
        setState({...state});
    }

    // For saving all information to database.
    const onSubmit = (e) => {
        console.log("Save Clicked");

        e.preventDefault();
        let modifiedState = state;

        // Validation of all required fields.
        modifiedState.errors.ProdName = (modifiedState.selectedProductName == null || modifiedState.selectedProductName == "" || modifiedState.selectedProductName.length < 0)
            ? "Please Add Product Name." 
            : "";

        // modifiedState.errors.fileUpload = (modifiedState.Image == null || modifiedState.Image == "" || modifiedState.Image.length < 0)
        //     ? "Please Upload Image." 
        //     : "";

        modifiedState.errors.PricePerUnit = (modifiedState.PricePerUnit == null || modifiedState.PricePerUnit == "" || modifiedState.PricePerUnit.length < 0)
            ? "Please Enter Price." 
            : "";

        // if any one of the required fields is not entered by user then return the function and show error message.
        if(modifiedState.errors.PricePerUnit.length > 0) {
            
            setState({...modifiedState});
            return
        } else {
            if(modifiedState.formViewMode == "editMode"){   
                onProductEdit(modifiedState);
            } else {
                onProductAdd(modifiedState);
            }
        }
    }

    const onProductEdit = (e) => {

        let modifiedState = state;

        let ProdCodeForEdit;

        if(modifiedState.formViewMode == "editMode")
        {   
            ProdCodeForEdit = modifiedState.ProductCode;
            
        } else {
            ProdCodeForEdit = null;    
        }

        if( modifiedState.fileToUploadFullPath == null || modifiedState.fileToUploadFullPath.length <= 0 ) {
            modifiedState.errors.others = "Please select a Image File for Uploading.";
            setState(modifiedState);
            return; // Dont process any further
        }

        let data = new FormData();
        data.append('ProductImage', modifiedState.fileToUploadFullPath);

        console.log("data = ", data);

        axios.post(`${getAPIHostURL()}/wclient/uploadImageFile`, data)
        .then(response => {
            if(response.data.code == "SUCCESS") {

                if( response.data.uploadedFile == null || response.data.uploadedFile.length <= 0 ) {
                    // File upload was unsuccessful because the file name was null or the file name was empty.
                    modifiedState.errors.others = "Please select a Image File for Uploading.";
                    
                    // Set error message (done below). Dont do any other processing after that.
                    
                } else {
                    let uploadedFileName = response.data.uploadedFile.filename;
                    let uploadedFilePath = "sufalamserver/devicesoftware"; // Directory

                    console.log("uploadedFileName = ", uploadedFileName);
                    console.log("uploadedFilePath = ", uploadedFilePath);

                    let JsonBody = {
                        ProdCode: ProdCodeForEdit,
                        ProductNameToSave: modifiedState.selectedProductName,
                        PricePerUnitToSave: trimStringAndRemoveTrailingComma(modifiedState.PricePerUnit),
                        FileName: uploadedFileName,
                        FilePath: uploadedFilePath,
                    }

                    // For saving/defining new Product's Information.
                    axios.post(`${getAPIHostURL()}/wclient/updateProductInfo`, JsonBody)
                    .then(response => {
                        if(response.data.code == "SUCCESS") {
                            alert(`Successfully 'updated' Product Details.`);
     
                            // closeModal();
                            modifiedState.modal = false;
                            getLatestProductInfo(modifiedState)

                            modifiedState.errors.others = "";
                            modifiedState.PricePerUnit = "";
    
                        } else {
                            if (response.data.code == 'SQL_ERROR') {
                                console.log("SQL Error while Saving Product Info.")
                                // Tell the user that server is experiencing issues (dont tell about SQL Error). User should try again later.
                                modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                            } else {
                                if (response.data.code == 'REQ_PARAMS_MISSING') {
                                    console.log("Request Parameters missing while Saving Product Info.")
                                    // Tell the user that server is experiencing issues (dont tell about SQL Error). User should try again later.
                                    modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                                } else {
                                    console.log("Should not reach here.")
                                    modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                                }
                            }
                        }
                        setState({...modifiedState});
                    })
                    .catch(error => {
                        console.log(error);
                        if (axios.isCancel(error)) {
                            console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
                        } else {
                            modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                        //   modifiedState.errors.others = t(IDS_RegistNetworkError);
                        setState({...modifiedState});
                    } 
                    });
                }
        
            } else {

                if(response.data.code == 'UPLOAD_ERROR') {
                    // Tell the user that Server is experiencing errors
                    modifiedState.errors.others = "Server experiencing issues while uploading Image file.\nTry again later.";
                } else {
                    console.log("Should not reach here.")
                    modifiedState.errors.others = "Server experiencing issues while uploading Image file.\nTry again later.";
                }
            }
            setState(modifiedState);
        })
        .catch(error => {

            console.log(error);
            if (axios.isCancel(error)) {
                console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
            } else {
                modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                setState(modifiedState); 
            } 
        });
    }


    const onProductAdd = (e) => {

        let modifiedState = state;

        if( modifiedState.fileToUploadFullPath == null || modifiedState.fileToUploadFullPath.length <= 0 ) {
            modifiedState.errors.others = "Please select a Image File for Uploading.";
            setState(modifiedState);
            return; // Dont process any further
        }

        let data = new FormData();
        data.append('ProductImage', modifiedState.fileToUploadFullPath);

        axios.post(`${getAPIHostURL()}/wclient/uploadImageFile`, data)
        .then(response => {
            if(response.data.code == "SUCCESS") {

                if( response.data.uploadedFile == null || response.data.uploadedFile.length <= 0 ) {
                    // File upload was unsuccessful because the file name was null or the file name was empty.
                    modifiedState.errors.others = "Please select a Image File for Uploading.";
                    
                    // Set error message (done below). Dont do any other processing after that.
                    
                } else {
                    let uploadedFileName = response.data.uploadedFile.filename;
                    let uploadedFilePath = "sufalamserver/devicesoftware"; // Directory

                    let JsonBody = {
                        ProductNameToSave: modifiedState.selectedProductName,
                        PricePerUnitToSave: trimStringAndRemoveTrailingComma(modifiedState.PricePerUnit),
                        FileName: uploadedFileName,
                        FilePath: uploadedFilePath,
                    }

                    // For saving/defining new Product's Information.
                    axios.post(`${getAPIHostURL()}/wclient/insertProductInfo`, JsonBody)
                    .then(response => {
                        if(response.data.code == "SUCCESS") {
                            alert(`New Product Created Successfully.`);
    
                            // closeModal();
                            modifiedState.modal = false;
                            getLatestProductInfo(modifiedState)

                            modifiedState.errors.others = "";
                            modifiedState.PricePerUnit = "";
    
                        } else {
                            if (response.data.code == 'SQL_ERROR') {
                                console.log("SQL Error while Saving Product Info.")
                                // Tell the user that server is experiencing issues (dont tell about SQL Error). User should try again later.
                                modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                            } else {
                                if (response.data.code == 'REQ_PARAMS_MISSING') {
                                    console.log("Request Parameters missing while Saving Product Info.")
                                    // Tell the user that server is experiencing issues (dont tell about SQL Error). User should try again later.
                                    modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                                } else {
                                    console.log("Should not reach here.")
                                    modifiedState.errors.others = "Server experiencing issues.\nTry again later."; // TODO: Define generic language error for this
                                }
                            }
                        }
                        setState({...modifiedState});
                    })
                    .catch(error => {
                        console.log(error);
                        if (axios.isCancel(error)) {
                            console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
                        } else {
                            modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                        //   modifiedState.errors.others = t(IDS_RegistNetworkError);
                        setState({...modifiedState});
                    } 
                    });
                }
            } else {
                if(response.data.code == 'UPLOAD_ERROR') {
                    // Tell the user that Server is experiencing errors
                    modifiedState.errors.others = "Server experiencing issues while uploading Image file.\nTry again later.";
                } else {
                    console.log("Should not reach here.")
                    modifiedState.errors.others = "Server experiencing issues while uploading Image file.\nTry again later.";
                }
            }
            setState(modifiedState);
        })
        .catch(error => {

            console.log(error);
            if (axios.isCancel(error)) {
                console.log('Axios request cancelled beacuse of too many requests being sent to the Server.');
            } else {
                modifiedState.errors.others = 'Network issues.\nCheck your Internet and Try again later.';
                setState(modifiedState); 
            } 
        });
    }


    const {errors, successfulRegisterMsg}=state;
    
    return (
        <div>
            <div className="row justify-content-center">
                <div className = "container col-lg-12" style = {{display: "flex", justifyContent: "space-between", padding: "0.2rem"}}>
                    <div>
                        <button type = "button" 
                            className = "btn-md addProdBtn" 
                            style = {{background: "transparent", pointerEvents: "none", border: "none", color:"transparent"}} 
                        >
                            Add New Product
                        </button>  
                    </div>
                    <div className = "prodTableHeading" style={{fontSize: "2rem"}}>
                        Sufalam Retails
                    </div> 
                    <div>
                        <button type = "button" 
                            id = "addProduct"
                            className = "btn-md iconButton" 
                            // className="iconButton"
                            onClick = {openCreateProductModal}
                            style = {{textTransform: 'capitalize', marginRight: "1rem", borderRadius: "5px", 
                                        color:"white", fontWeight:"500"}}
                            >   
                            Add New Product
                        </button>
                    </div> 
                </div>
                <div>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <div className="divForShowingDashBoard">
                            <div style={{display: "flex"}}>
                                <div className="startAndEnddate">
                                    <label style={{fontSize:"0.9rem", marginLeft:"0.2rem"}}>
                                        Start Date:
                                    </label>
                                    <DateTimePicker
                                        clearIcon={null}
                                        onChange={onChangeStartDate}
                                        format={"yyyy/MM/dd"} 
                                        value={state.startDate} 
                                        name="startDateTime"
                                        timeFormat={false}
                                        className="dashBoardDateTimeZIndex"
                                    />                                
                                </div>
                                <div className='divForEndDate'> 
                                    <label style={{fontSize:"0.9rem", marginLeft:"1rem"}}>
                                        &nbsp;End Date:
                                    </label>
                                    <DateTimePicker
                                        clearIcon={null}
                                        onChange={onChangeEndDate}
                                        format={"yyyy/MM/dd"} 
                                        value={state.endDate} 
                                        name="endDateTime"
                                        timeFormat={false}
                                        className="dashBoardDateTimeZIndex"
                                    />           
                                </div>

                                <div className='divToShowRefreshAndClearBtnDashBoard'
                                        style={{display: "flex", justifyContent: "center", flexDirection: "row"}}>
                                    <div style={{marginLeft: "0.2rem"}} hidden = {state.showRefreshBtn == true ? false : true}> 

                                        <button type="button"
                                                title= "Refresh Data as per the selected date."
                                            onClick = {() => refresh()}
                                            style={{borderRadius: "5px", 
                                                    color:"white",
                                                    // marginLeft:"5%", 
                                                    fontWeight:"500",

                                                }}
                                            className="iconButton"
                                        >
                                            <i className="fa fa-refresh" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                    <div style={{marginLeft: state.showRefreshBtn == true ? "0.2rem" : "2rem"}} 
                                        hidden = {state.showClearBtn == true ? false : true}
                                    >
                                        <button type="button"
                                                title= {state.startDateSelected == true ? "Clear Selected Dates." : 
                                                        state.endDateSelected == true ? "Clear End Date." : "Clear"}
                                                onClick={ () => clearDates()} 
                                                style={{borderRadius: "5px",
                                                        color:"white", 
                                                        fontWeight:"900",
                                                        width: "110%"

                                                }}
                                                className="iconButton"
                                        > 
                                            X 
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="divForShowingDashBoard" style={{width: "30%"}}>
                            <div style={{display: "flex", justifyContent: "space-between"}}>
                                <div style={{paddingLeft: "1rem"}}>
                                    Search Product Name:
                                </div>
                                <input type='text' name='productName' 
                                    // className=" trackFrmInputForm"
                                    style={{width: "35%"}}
                                    value={state.productName}
                                    onChange={handleChange} noValidate    
                                /> 
                                <button type="button"
                                        title= "Refresh Data as per the selected date."
                                        // onClick = {() => getLatestProductInfo(null, "search")}
                                        onClick = {() => searchProduct(null)}
                                        style={{borderRadius: "5px", 
                                                color:"white",
                                                marginLeft:"1%", 
                                                fontWeight:"500",

                                            }}
                                        className="iconButton"
                                >
                                    <i className="fa fa-search" aria-hidden="true"></i>
                                </button>
                                <div style={{marginLeft: "0.2rem"}}>
                                    <button type="button"
                                            title= {state.startDateSelected == true ? "Clear Selected Dates." : 
                                                    state.endDateSelected == true ? "Clear End Date." : "Clear"}
                                            onClick={ () => clearDates()} 
                                            style={{borderRadius: "5px",
                                                    color:"white", 
                                                    fontWeight:"900",
                                                    width: "110%"

                                            }}
                                            className="iconButton"
                                    > 
                                        X 
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style={{display: "flex"}}>
                                <div className="divForShowingDashBoard">
                                    <div style={{display: "flex", justifyContent: "space-between"}}>
                                        <div style={{paddingLeft: "1rem"}}>
                                            Sort By
                                        </div>
                                        <button type="button"
                                                // onClick={ () => getLatestProductInfo(null)}
                                                onClick={ () => sortAscOrDesc("asc")}
                                                style={{borderRadius: "5px",
                                                        color:"white", 
                                                        fontWeight:"900",
                                                        width: "35%"

                                                }}
                                                className="iconButton"
                                        > 
                                            Ascending
                                        </button>

                                        <button type="button"
                                                onClick={ () => sortAscOrDesc("desc")}
                                                style={{borderRadius: "5px",
                                                        color:"white", 
                                                        fontWeight:"900",
                                                        width: "38%",
                                                        marginRight: "0.3rem"

                                                }}
                                                className="iconButton"
                                        > 
                                            Descending 
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>  
                </div>

                <div>
                    {state.errors.ProdName.length > 0 && 
                        <p style={{color:"Red", fontSize:"0.8rem", textAlign:"center", marginTop: "1rem"}} className='error'>{state.errors.ProdName}</p> 
                    }
                </div>

                <div>
                    {state.errors.timeRelatedErr.length > 0 && 
                        <p style={{color:"Red", fontSize:"0.8rem", textAlign:"center", marginTop: "1rem"}} className='error'>{state.errors.timeRelatedErr}</p> 
                    }
                </div>

                <div>
                    {state.errors.others.length > 0 && 
                        <p style={{color:"Red", fontSize:"0.8rem", textAlign:"center", marginTop: "1rem"}} className='error'>{state.errors.others}</p> 
                    }
                </div>
                
                <div class="border border-3 ReactTableStyle">
                    <ReactTable 
                        columns={state.columns} 
                        data={state.data}
                        passedStateVariable = {state.goToPage1}
                        getCellProps={(cellInfo) => {
                            let modifiedState = state;
                            return {
                                onClick: () => {
                                    modifiedState.selectedRowIndex = cellInfo.row.index;
                                    setState({...modifiedState});

                                    if(cellInfo.column.id == "edit"){
                                        onEditProductDetails(cellInfo.row, cellInfo.column);
                                    } else if(cellInfo.column.id == "delete"){
                                        deleteProduct(cellInfo.row, cellInfo.column);
                                    }              
                                }, 
                                style: {
                                    cursor: 'pointer',
                                    background: cellInfo.row.index === modifiedState.selectedRowIndex ? '#6c95ba' : '',
                                    color: cellInfo.row.index === modifiedState.selectedRowIndex ? 'white' : 'black',
                                    alignItems: "center",
                                }
                            }
                        }
                    }
                    />
                </div>

                <Modal size="lg" isOpen={state.modal} backdrop={state.backdrop}>
                    <ModalHeader toggle={toggle} style={{textAlign: "center"}}>
                        {state.formViewMode == "editMode" ? <span> Edit Product Details </span> 
                        : <span>Add New Product </span>}
                    </ModalHeader>
                    <ModalBody>  
                        <div className="container">
                            <div className="row justify-content-center">
                                <div className="container col-lg-6 col-lg-offset-3
                                                        col-md-8 col-md-offset-2">
                                    <div className="modal-body box">
                                        <form onSubmit={onSubmit} encType='multipart/form-data'>
                                            <div>
                                                {(state.formViewMode == "editMode") ?
                                                    <div style={{marginTop: "0.5rem"}}>
                                                        <label className="reg-form-label">Edit Product Name : </label>
                                                       
                                                        <input type='text' className="input-form" 
                                                                    value= {state.selectedProductName} 
                                                                    onChange={OnChangeProductNameSelection}
                                                        />  
                                                    </div>
                                                :
                                                    <div style={{marginTop: "0.5rem"}}>
                                                        <label className="reg-form-label">Add Product Name : </label>
                                                        <div>
                                                            <input type="list" list="dataListForProdName" 
                                                                    className="input-form"
                                                                    style={{marginTop: "0.5rem", width: "100%"}}
                                                                    value={state.selectedProductName} 
                                                                    onChange={OnChangeProductNameSelection}
                                                            />
                                                            <datalist id="dataListForProdName">
                                                                {(state.ProdNameArr).map((singleProdName, index) =>
                                                                    <option key={index} value={singleProdName.displayValue}>{singleProdName}</option>
                                                                )}
                                                            </datalist>
                                                            {errors.ProdName.length > 0 && 
                                                                            <span  className='validationErrorLabel'>{errors.ProdName}</span>} 
                                                        </div>
                                                    </div>
                                                }
                                            </div>

                                            <div className="form-group addCustForm">
                                                <div style={{marginTop: "0.5rem"}}>
                                                    {/* <label style={{fontSize: "0.9rem"}}> */}
                                                    <label className="reg-form-label">
                                                        {(state.formViewMode == "editMode") ? 
                                                            `Uploaded image is ${state.originalImagePath}` : 
                                                            "Upload image"
                                                        }
                                                    </label>
                                                    <div>
                                                        <input type="file" className="" 
                                                            name="ProductImage"
                                                            style={{width: "85%"}}
                                                            id='files'
                                                            onChange={onFileSelection}
                                                        />
                                                        <div>
                                                            {state.formViewMode != "editMode" && errors.fileUpload.length > 0 && 
                                                                        <span  className='validationErrorLabel'>{errors.fileUpload}</span>} 
                                                        </div>
                                                    </div>     
                                                </div> 
                                            </div> 

                                            <div style={{marginTop:"0.5rem"}}>
                                                <div style={{display: "flex", flexDirection: "column"}}>
                                                    <label className="reg-form-label">Enter Price: </label>
                                                    <input type='number' className="input-form" style={{width: "100%"}}
                                                                        value= {state.PricePerUnit} onChange={onEnteredPricePerUnit}
                                                    />  
                                                    {errors.PricePerUnit.length > 0 && 
                                                                        <span  className='validationErrorLabel'>{errors.PricePerUnit}</span>}
                                                </div>
                                            </div>

                                            <div style={{marginTop: "1rem", display: "flex", justifyContent: "space-evenly"}}>
                                                <div>
                                                    <button type="button" 
                                                        // className="addProdSavebtn" 
                                                        className = "btn-md iconButton"
                                                        onClick={closeModal} name="Back" 
                                                        // style={{pointerEvents: "auto"}}
                                                        style = {{textTransform: 'capitalize', marginRight: "1rem", borderRadius: "5px", 
                                                                color:"white", fontWeight:"500"}}
                                                    > 
                                                    Back</button>
                                                </div >
                                                <div style={{ display: `${state.formViewMode == "viewMode" ? "none" : "block"}` }}>
                                                    <button type="submit" 
                                                        // className="addProdSavebtn"  
                                                        className = "btn-md iconButton"
                                                        name="Save"
                                                        style = {{textTransform: 'capitalize', marginRight: "1rem", borderRadius: "5px", 
                                                                color:"white", fontWeight:"500"}}>
                                                    Save</button>
                                                </div>
                                            </div>

                                            <div className = "buttonErrorMessage">
                                                {state.errors.others.length > 0 && 
                                                    <p style={{color: 'var(--errorColor)', fontSize: '0.8rem'}} className='error'>{state.errors.others}</p>}
                                            </div> 
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                </Modal>
            </div>
        </div>
    );
    
}

export default VcProduct;