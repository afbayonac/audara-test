const pool = require('../../config/db');
const validateForm = require('../../validations/validator')
const { createCallRateValidation, updateCallRateValidation } = require('./ratesValidations');

const successCode = "2901";
const errorCode = "2904";

const serverError = {
  code: errorCode,
  msg: {
    error: "serverError",
  }
};

// Handle code
exports.handleCode = async (apiCode, req, res) => {

  try {
    switch (apiCode) {

      // Show callQueue
      case "2500":
        return await showCallRate(req, res);

      // Create callRate
      case "2510":
          return await createCallRate(req, res);
      
      // show List callRate
      case "2511":
          return await showCallRateListPag(req, res);

      // Create callRate
      case "2512":
          return await updateCallRate(req, res);

      // delete callRate
      case "2513":
          return await deleteCallRate(req, res);

      // Create callRate
      case "2514":
          return await changeStatusCallRate(true)(req, res);

      // Create callRate
      case "2515":
        return await changeStatusCallRate(false)(req, res);

      // Create callRate
      case "2518":
        return await showCurrencyList(req, res);

      // Create callRate
      case "2519":
        return await showCallRateList(req, res);

      // Default 
      default:
        return res.status(500).json(serverError);
    }
  } catch (error) {
    return res.status(500).json(serverError);
  }
}

const showCallRate = async (req, res) => {
  try {
    const queueId = parseInt(req.query.id) || '';

    // If id is empty
    if (queueId === '') {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "id is empty",
        }
      });
    }    
   
    // Gets queue data
    const result = await pool.query(`SELECT * FROM rates WHERE id = ?`, [queueId]);
    
    // Not found
    if (!result) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "notFoundError",
        }
      });
    }
      
    return res.status(200).json({
      code: successCode,
      msg: {
        data: result,
      }
    });    
  } 
  catch (error) {
    console.log(err)
    return res.status(500).json(serverError);
  }  
}

const createCallRate = async (req, res) => {
  try {
    const dataQueueIn = req.body;

    // sanear
    dataQueueIn.status = dataQueueIn.status === 'true' ? true :
                         dataQueueIn.status === 'false' ? false :
                         ''

    const formErrors = validateForm(dataQueueIn, createCallRateValidation);

    if (formErrors) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: formErrors,
        }
      });
    }
  
    // Saves queue in
    const saveCallRateResult = await pool.query(
      `INSERT INTO
      rates
      (${Object.keys(dataQueueIn).join(',')})
      VALUES ? `,

      [
        Object.keys(dataQueueIn).map(key => {
          if (key === 'status') {
            return dataQueueIn[key] ? 'ACTIVE' : 'INACTIVE'
          }
          
          return dataQueueIn[key]
        })
      ]
    ); 

    delete saveCallRateResult["meta"];

    // If it was not created
    if (saveCallRateResult['insertId'] === 0){
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "Record not created",
        }
      });
    }

    return res.status(200).json({
      code: successCode,
      msg: {
        data: {
          id: saveCallRateResult.insertId,
          ...dataQueueIn
        },
      }
    });  
  } 
  catch (error) {
    console.log(error)
    return res.status(500).json(serverError);
  }    
}

const showCallRateListPag = async (req, res) => {
  try {
    const filters = req.body.filters || {};

    const perpage = Number(req.body.perpage || 10);
    const page = Number(req.body.page || 1);
  
    const orderField = String(req.body.orderField || "name");
    const order = String(req.body.order || "asc");
  
    const name = String(filters.name || '');

    // Order must be "asc" or "desc"
    if (!(["asc", "desc"].includes(order.toLowerCase()))) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "order must be asc or desc",
        }
      });
    }

    // Orderfield must be one of the following fields
    const orderFields = ["name", "status"];

    if (!(orderFields.includes(orderField.toLowerCase()))) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "Invalid orderField",
        }
      });
    }

    // WHERE query
    const whereQuery = name.length > 0 ? `WHERE q.name LIKE CONCAT(?, '%')` : '';

    // WHERE parameters
    const whereParam = [
      ...(name.length > 0 ? [name] : [])
    ]


    // Gets list data
    const resultData = await pool.query(
      `SELECT 
      q.id,
      IFNULL(q.name, '') as name,
      IFNULL(q.prefix, '') as prefix,
      IFNULL(q.min_rate, '') as rate_min,
      IFNULL(q.sec_rate, '') as rate_sec,
      IFNULL(q.status, '') as status,
      c.symbol as currency
      FROM rates q     
      LEFT JOIN currencies c ON c.id = q.currency_id
      ${whereQuery}
      GROUP BY q.id
      ORDER BY ${orderField} ${order} 
      LIMIT ? 
      OFFSET ?`,
      
      [
        ... whereParam,
        perpage,
        ((page - 1) * perpage),
      ]
    );
    delete resultData["meta"];
    
    // Gets totals data
    const resultTotals = await pool.query(
      `SELECT 
        COUNT(DISTINCT id) AS records 
      FROM rates q
      ${whereQuery}`,

      [
        ... whereParam
      ]
    );

    delete resultTotals["meta"];

    // Checks for errors
    if (!resultTotals) {
      throw "resultTotals error";
    }

    // If resultData is empty
    if (resultData.length < 1) {
      return res.status(200).json({
        code: successCode,
        msg: {
          data: resultData,
        }
      });
    }

    // Structures list data
    console.log(resultData)
    const listData = [];
    for (let i = 0; i < resultData.length; i++) {                
      const item = resultData[i];
      listData.push({
        id: item.id,
        tr: [
          {
            td: 'name',
            value: item.name,
          },
          {
            td: "prefix",
            value: item.prefix
          },
          {
            td: "currency",
            value: item.currency 
          },
          {
            td: "rate_min",
            value: item.rate_min
          },
          {
            td: "rate_sec",
            value: item.rate_sec
          },
          {
            td: "status",
            value: item.status
          }
        ]
      })
    }
    
    // Return list data
    const totalhits = resultTotals.reduce((accumulator, currentValue) => accumulator += currentValue.records, 0);
    return res.status(200).json({
      code: successCode,
      msg: {
        data: listData,
        from: ((page - 1) * perpage) + 1,
        to: Math.min(((page - 1) * perpage) + perpage, totalhits),
        per_page: Number(perpage),
        totalhits: totalhits,
        current_page: Number(page)
      }
    });
  } 
  catch (error) {
    console.log(error)
    return res.status(500).json(serverError);
  }  
}

const updateCallRate = async (req, res) => {
  try {
    const queueId = parseInt(req.query.id) || '';

    // If id is empty
    if (queueId === '') {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "id is empty",
        }
      });
    }    

    const dataQueueIn = req.body;

    // sanear
    if(dataQueueIn.status !== undefined) {
      dataQueueIn.status = dataQueueIn.status === 'true' ? true :
      dataQueueIn.status === 'false' ? false :
      ''
    }

    const formErrors = validateForm(dataQueueIn, updateCallRateValidation);

    if (formErrors) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: formErrors,
        }
      });
    }
  
    const updates = Object.keys(dataQueueIn)
      .filter(key => dataQueueIn[key] !== '' )
      .map(key => {
        if (key === 'status') {
          return ` ${key} = ${ dataQueueIn[key] ? "'ACTIVE'" : "'INACTIVE'" }`
        }
        return ` ${key} = "${ dataQueueIn[key] }"`
      })
      .join(',')

    const updateRate = await pool.query(
      `UPDATE rates SET ${updates} WHERE id = ?`,
      [
        queueId
      ]
    ); 
    
    delete updateRate["meta"];

    // If it was not created
    if (updateRate['affectedRows'] === 0){
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "Not update",
        }
      });
    }

    // Gets queue data
    const result = await pool.query(`SELECT * FROM rates WHERE id = ?`, [queueId]);

    // Not found
    if (!result) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "notFoundError",
        }
      });
    }

    return res.status(200).json({
      code: successCode,
      msg: {
        data: result,
      }
    });  
  } 

  catch (error) {
    return res.status(500).json(serverError);
  }    
}

const deleteCallRate = async (req, res) => {
  try {
    const queueId = parseInt(req.query.id) || '';

    // If id is empty
    if (queueId === '') {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "id is empty",
        }
      });
    }    
   
    // Gets queue data
    const result = await pool.query(`DELETE FROM rates WHERE id = ?;`, [queueId]);
    console.log(result)
    // Not found
    if (!result) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "notFoundError",
        }
      });
    }
      
    return res.status(200).json({
      code: successCode,
      msg: {
        data: 
        { delete: true},
      }
    });    
  } 
  catch (error) {
    console.log(error)
    return res.status(500).json(serverError);
  }  
}

const changeStatusCallRate = (status) => async (req, res) => {
  try {
    const queueId = parseInt(req.query.id) || '';

    // If id is empty
    if (queueId === '') {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "id is empty",
        }
      });
    }    

    const updateRate = await pool.query(
      `UPDATE rates SET status = '${status ? 'ACTIVE' : 'INACTIVE' }' WHERE id = ?`,
      [
        queueId
      ]
    ); 
    
    delete updateRate["meta"];

    // If it was not created
    if (updateRate['affectedRows'] === 0){
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "Not update",
        }
      });
    }

    return res.status(200).json({
      code: successCode,
      msg: {
        data: {
          id: updateRate.insertId,
          status
        },
      }
    });  
  } 

  catch (error) {
    console.log(error)
    return res.status(500).json(serverError);
  }    
}

const showCurrencyList = async (req, res) => {
  try {

    // Gets queue data
    const resultData = await pool.query(
      `SELECT 
        *
      FROM currencies
      ORDER BY name asc`
    );

    delete resultData["meta"];

    console.log(resultData)
    
    // Not found
    if (!resultData) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "notFoundError",
        }
      });
    }
      
    return res.status(200).json({
      code: successCode,
      msg: {
        data: resultData,
      }
    });    
  } 
  catch (error) {
    return res.status(500).json(serverError);
  }  
}

const showCallRateList = async (req, res) => {
  try {

    // Gets queue data
    const resultData = await pool.query(
      `SELECT 
        *
      FROM rates
      ORDER BY name asc`
    );

    delete resultData["meta"];

    console.log(resultData)
    
    // Not found
    if (!resultData) {
      return res.status(200).json({
        code: errorCode,
        msg: {
          error: "notFoundError",
        }
      });
    }
      
    return res.status(200).json({
      code: successCode,
      msg: {
        data: resultData,
      }
    });    
  } 
  catch (error) {
    return res.status(500).json(serverError);
  }  
}