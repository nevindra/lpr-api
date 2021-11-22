const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {getPlateNumber} = require('./send-api')
const {sendNotificationIn} = require('./notifications')
const axios = require("axios");
const fs = require("fs");

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

exports.detectImg = async (req,res) => {
    const imgUrl = req.file.path
    try {
        const plate_number = await getPlateNumber(imgUrl)
        if (plate_number === "") {
            return res.status(400).send({
                status: 400,
                error: "No plate number detected"
            })
        } else {
            const result = await prisma.car.findOne({
                where: {
                    plate_number: plate_number
                }
            })
            if (result) {
                return res.status(200).send({
                    status: 200,
                    car: result
                })
            } else {
                return res.status(400).send({
                    status: 404,
                    error: "No car found"
                })
            }
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send({
            status: 500,
            error: "An error has occured"
        })
    }
}

exports.parkingIn = async (req,res) => {
    const imgUrl = req.file.path
    const plate_number = await getPlateNumber(imgUrl)
    try {
        const vehicle = await prisma.vehicles.findUnique({
            where: {
                plate_number: plate_number
            }
        })
        const time_in = new Date()
        let parking;
        if (vehicle) {
            // check if user is already booking or not
            const booking = await prisma.$queryRaw`SELECT id_booking FROM bookings WHERE id_vehicle = ${vehicle.id_vehicle}`
            console.log(booking[0] === undefined);
            // user is already booking
            if (booking[0] !== undefined) {
                await prisma.bookings.update({
                    where : {
                        id_booking: booking.id_booking
                    },
                    data: {
                        status: "DONE"
                    }
                })
                // create new parking record
                parking = await prisma.parkings_transactions.create({
                    data: {
                        id_user: vehicle.id_user,
                        id_vehicle: vehicle.id_vehicle,
                        id_place:1,
                        time_in: time_in,
                        is_done: false
                    }
                })
            } else {
                // user is not booking, create new parking record
                parking = await prisma.parkings_transactions.create({
                    data: {
                        id_user: vehicle.id_user,
                        id_vehicle: vehicle.id_vehicle,
                        id_place:1,
                        time_in: new Date(),
                        is_done: false
                    }
                })
            }
            const user = await prisma.users.findUnique({
                where: {
                    id_user: vehicle.id_user
                }
            })
            await sendNotificationIn(user.device_token, {
                title: "Parking In",
                body: "You have entered the parking lot",
                click_action: "com.dicoding.nextparking.HomeActivity"
            }, {
                place: "Parking Lot",
                time: time_in,
            })
            return res.status(200).send({
                message: "Parking In",
                plate_number: plate_number,
                parking: parking
            })
        } else {
            return res.status(404).send({
                status: 404,
                vehicle: null
            })
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({
            status: 500,
            error: "An error has occured"
        })
    }
}

exports.parkingOut = async (req,res) => {
    const imgUrl = req.file.path
    const plate_number = await getPlateNumber(imgUrl)

    try {
        // search user's vehicle
        const vehicle = await prisma.vehicles.findUnique({
            where: {
                plate_number: plate_number
            }
        })
        // search user's parking transaction
        const parking = await prisma.parkings_transactions.findMany({
            where: {
                id_vehicle: vehicle.id_vehicle,
                is_done: false
            }
        })
        const time_out = new Date()
        if (parking[0] !== undefined) {
            // update parking transaction record
            const updatedParking = await prisma.parkings_transactions.update({
                where : {
                    id_parking: parking[0].id_parking
                },
                data: {
                    time_out: time_out,
                    is_done: true
                }
            })
            const user = await prisma.users.findUnique({
                where: {
                    id_user: vehicle.id_user
                }
            })
            await sendNotificationIn(user.device_token, {
                title: "Parking Out",
                body: "You have left the parking lot",
                click_action: "com.dicoding.nextparking.ui.payment.PaymentActivity"
            }, {
                place: "Parking Lot",
                time_in: parking[0].time_in,
                time_out: time_out,
                total_time: time_out - parking[0].time_in
            })
            return res.status(200).send({
                message: "Parking Out",
                plate_number: plate_number,
                parking: updatedParking
            })
        } else {
            return res.status(404).send({
                status: 404,
                parking: null
            })
        }
    } catch (e) {
        console.log(e)
        return res.status(500).send({
            status: 500,
            error: "An error has occured"
        })
    }
}