module.exports = {
    apps: [
      {
        name: 'api_chat_service:5512 ',
        script: 'node ./dist/main.js',
        cwd: '/home/fuse_admin/repos_chat/api_chat_service',
        env: {
          NODE_ENV: 'production',
          PORT: 5512,
        },
      },
    ],
  };
  