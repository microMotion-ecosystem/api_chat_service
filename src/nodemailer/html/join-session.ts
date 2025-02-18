export const joinSessionInvitation = (
    code: string,
    name: string,
    sessionId: string
  ) => `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to a Chat Session</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            padding: 20px;
            font-size: 22px;
            font-weight: bold;
            border-radius: 12px 12px 0 0;
        }
        .content {
            padding: 25px;
            font-size: 16px;
            color: #444;
        }
        .highlight {
            font-size: 22px;
            font-weight: bold;
            color: #333;
            margin: 20px 0;
        }
        .button-container {
            margin-top: 25px;
            text-align: center;
        }
        .button {
            display: inline-block;
            padding: 14px 22px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            font-weight: bold;
            border-radius: 8px;
            transition: background 0.3s ease-in-out;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
            border: none;
            cursor: pointer;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            font-size: 12px;
            color: #777;
            margin-top: 30px;
            padding: 15px;
            border-top: 1px solid #dddddd;
        }
    </style>
  </head>
  <body>
    <div class="container">
        <div class="header">
            You're Invited to Join a Chat Session 🎉
        </div>
        <div class="content">
            <p>Hey <strong>${name}</strong>,</p>
            <p>You have been invited to join a session in <strong>ChatLLM App</strong>!</p>
            <p>Use the following unique code to accept the invitation:</p>
            <div class="highlight">${code}</div>
            <p>Click the button below to accept and join the session.</p>
            
            <div class="button-container">
                <button onclick="acceptInvitation()" class="button">Accept Invitation</button>
            </div>
    
            <p>If you did not expect this invitation, feel free to ignore this email.</p>
        </div>
        <div class="footer">
            <p>Need help? Contact our support team.</p>
            <p>Thanks for using <strong>ChatLLM App</strong>!</p>
        </div>
    </div>
    
    <script>
        function acceptInvitation() {
            // Construct the GET URL with the code as a path param and sessionId as a query param
            const url = "http://[::1]:5512/api/v1/session/acceptInvitation/" +
                        encodeURIComponent("${code}") +
                        "?sessionId=" +
                        encodeURIComponent("${sessionId}");
            
            fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-Platform": "fuse"
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                // Replace the current content with a success message and login link.
                // Note: The inner template literal is escaped using \` so it doesn't conflict with the outer one.
                document.body.innerHTML = \`
                    <div class="container">
                        <div class="header">Session Joined Successfully!</div>
                        <div class="content">
                            <p>Congratulations, <strong>${name}</strong>! You have successfully joined the session.</p>
                            <p>Please click the button below to login and view your sessions:</p>
                            <a href="https://chat.deepseek.com/" class="button">Login</a>
                        </div>
                        <div class="footer">
                            <p>Need help? Contact our support team.</p>
                        </div>
                    </div>
                \`;
            })
            .catch(error => {
                alert("Error accepting invitation. Please try again.");
                console.error("Error:", error);
            });
        }
    </script>
  </body>
  </html>`;
  