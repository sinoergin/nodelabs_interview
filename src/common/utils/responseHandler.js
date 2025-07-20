const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        data,
        message,
    });
};

export { sendSuccess };
