# Gamba

Gamba is a Discord bot to create predictions based on Twitch Channel Points Predictions.

## Getting Started

You can [invite](https://discord.com/api/oauth2/authorize?client_id=939110963506982972&permissions=8&scope=applications.commands%20bot) Gamba to your Discord server. Or, you can download the source code and run the bot yourself.

### Prerequisites

Use the latest package manager [Node.js](https://nodejs.org/) to install Gamba.

```sh
npm install npm@latest -g
```

Create or have an existing Discord account at [Discord](https://discord.com/).

### Installation

1. Log in to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click on the "New Application" button located at the top right.
3. Give the application a name and click `Create`.
4. Under `Bot`, copy the `Token` of the bot.
5. Locate `Privileged Gateway Intents`, and enable `Presence Intent` and `Server Members Intent`.
6. Under `OAuth2 > General`, copy the `Client ID` of the bot.
7. Under `OAuth2 > URL Generator`, select `bot` and `application.commands` for scopes and `Administrator` for bot permissions. Copy the generated URL at the bottom of the page.
8. Clone the repository:
   ```sh
   git clone git@github.com:tobyjzstay/Gamba.git
   ```
9. Install NPM packages in the cloned repository:
   ```sh
   npm install
   ```
10. Create a file named `config.js` at the root level and copy the following:
    ```json
    {
      "clientId": "<Client ID>",
      "token": "<Token>",
      "path": {
        "points": "./data/points/",
        "predictionsActive": "./data/predictions/active/",
        "predictionsArchive": "./data/predictions/archive/"
      }
    }
    ```
11. Run the bot:
    ```sh
    npm start
    ```
12. Invite the bot to your Discord server with the generated URL.

## Usage

| Command                              | Description                  |
| :----------------------------------- | :--------------------------- |
| `/gamba`                             | Lists all active predictions |
| `/points [user]`                     | Get points                   |
| `/leaderboard [role]`                | Show points leaderboard      |
| `/predict <id> <index> <amount>`     | Predict with points          |
| `/prediction <id>`                   | Show a prediction            |
| `/create <name> <option1> <option2>` | Create a new prediction      |
| `/close <id>`                        | Close a prediction           |
| `/end <id> <index>`                  | End a prediction             |
| `/delete <id>`                       | Delete a prediction          |

## Licence

[MIT](/LICENCE)
