const request = async (url: string, headers: any, method: "GET" | "POST", data?: any ) => {
  try {
    const response = await axios({
      url,
      method,
      headers: headers,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`Request failed: ${error}`);
    return null;
  }
}

module.exports = {
  request
}