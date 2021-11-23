// send notifications with Firebase Cloud Messaging
const FCM = require("fcm-node");

exports.sendNotificationIn = async (device_token, notification, payload) => {
    const serverKey = process.env.FCM_SERVER_KEY
    let fcm = new FCM(serverKey)
    let message;
    if (notification.title === "Parking In") {
        message = {
            to: device_token,
            notification: {
                title: notification.title,
                body: notification.body,
                click_action: notification.click_action,
            },
            data: {  //you can send only notification or only data(or include both)
                place: payload.place,
                time_in: payload.time_in
            }
        }
    } else if (notification.title === "Parking Out") {
        message = {
            to: device_token,
            notification: {
                title: notification.title,
                body: notification.body,
                click_action: notification.click_action,
            },
            data: {
                place: payload.place,
                time_in: payload.time_in,
                time_out: payload.time_out,
                total_time: payload.time_in - payload.time_out,
            }
        }
    }
    console.log(message.notification)
    fcm.send(message, function(err, response){
        if (err) {
            console.log(err)
            console.log("Something has gone wrong!")
        } else {
            console.log("Successfully sent with response: ", response)
        }
    })
}