// Call queue validations
exports.createCallRateValidation = {
    name: 'required|max:40|type:alphaNumericDash',
    prefix: 'required|max:10|type:number',
    number_of_digits: 'required|max:2|type:numeric',
    min_rate: 'required|type:float',
    sec_rate: 'required|type:float',
    currency_id: 'required|max:11|type:numeric',
    status: 'type:bool',
}


// Call queue validations
exports.updateCallRateValidation = {
    name: 'max:40|type:alphaNumericDash',
    prefix: 'max:10|type:number',
    number_of_digits: 'max:2|type:numeric',
    min_rate: 'type:float',
    sec_rate: 'type:float',
    currency_id: 'max:11|type:numeric',
    status: 'type:bool',
}
