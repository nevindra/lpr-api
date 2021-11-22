const axios = require("axios");
const fs = require("fs");
const config = require("../config.json");
const datauri = require("datauri");

exports.getAuth = async (req,res) => {
    try {
        const result = await axios.post('https://backend.cloud.nodeflux.io/auth/signatures', {
            "access_key": process.env.ACCESS_KEY,
            "secret_key": process.env.SECRET_KEY,
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        fs.writeFile('config.json', JSON.stringify(result.data), (error) => {
            if (error) {
                console.log(error);
            }
        });
        return res.status(200).send(result.data)
    } catch (e) {
        console.log(e);
        return res.status(500).send({
            error: "An error has occured"
        })
    }
}

exports.getPlateNumber = async (imgUrl) => {
    const ACCESS_KEY = process.env.ACCESS_KEY
    const TOKEN = config.token
    const DATE = config.headers["x-nodeflux-timestamp"]
    const content = await datauri(imgUrl);

    const auth = `NODEFLUX-HMAC-SHA256 Credential=${ACCESS_KEY}/${DATE.substring(0,8)}/nodeflux.api.v1beta1.ImageAnalytic/StreamImageAnalytic, SignedHeaders=x-nodeflux-timestamp, Signature=${TOKEN}`

    const data = JSON.stringify({
        "images": [
            content
        ]
    });

    const post = {
        method: 'post',
        url: 'https://api.cloud.nodeflux.io/syncv2/analytics/license-plate-recognition',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
            'x-nodeflux-timestamp': DATE
        },
        data: data
    };

    try {
        const result = await axios(post)
        return result.data.result[0].license_plate_recognitions[0].license_plate_number
    } catch (e) {
        console.log(e);
    }
}