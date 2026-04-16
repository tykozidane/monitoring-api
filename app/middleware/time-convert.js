function toJakartaTime(date) {
    return new Date(
    new Date(date).toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
    })
    );
}

export default toJakartaTime;