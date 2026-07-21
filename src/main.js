document.getElementById("datepicker").addEventListener("change", () => {
  const date = document.querySelector("#datepicker").value;
  const API_KEY = import.meta.env.VITE_NASA_API_KEY;
  document.querySelector("#app").innerHTML = "<p>Hello world</p>";

  fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`).
  then(response => response.json()).then(data => {

    let media;

    if(data.media_type === "image") {
      media = `<img src="${data.url}" alt="${data.title}" />`;
    } else if(data.url.includes("youtube")) {
      media = `<iframe src="${data.url}" allowFullScreen></iframe>`
    } else {
      media = `<video src="${data.url}" controls></video>`;
    }

    document.querySelector("#app").innerHTML = `
      <h1>${data.title}</h1>
      <br>
      <p>Media type is: ${data.media_type}</p>
      <br>
      ${media}
      <br>
      <p>${data.explanation}</p>
    `;

  })
  .catch(err => {
    document.querySelector("#app").innerHTML = `<p>Error:${err.message}</p>`;
  });
});