const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'pavan007nadiger@gmail.com',
        subject: 'Thanks for joining us!',
        text: `Welcome to the Task App, ${name}. Let me know how you get along with our app.`
    })
}

const sendCancelEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'pavan007nadiger@gmail.com',
        subject: 'Sorry to see you leave!',
        text: `Goodbye, ${name}. I hope to see you back sometime soon.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}