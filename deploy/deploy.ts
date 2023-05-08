import { InMemorySigner } from "@taquito/signer";
import { MichelsonMap, TezosToolkit } from "@taquito/taquito";
import { buf2hex } from "@taquito/utils";
import chalk from "chalk";
import { Spinner } from "cli-spinner";
import dotenv from "dotenv";
import code from "../compiled/dao.json";
import metadata from "./metadata.json";

// Read environment variables from .env file
dotenv.config();

const missingEnvVarLog = (name: string) =>
  console.log(
    chalk.redBright`Missing ` +
      chalk.red.bold.underline(name) +
      chalk.redBright` env var. Please add it in ` +
      chalk.red.bold.underline(`deploy/.env`)
  );

const makeSpinnerOperation = async <T>(
  operation: Promise<T>,
  {
    loadingMessage,
    endMessage,
  }: {
    loadingMessage: string;
    endMessage: string;
  }
): Promise<T> => {
  const spinner = new Spinner(loadingMessage);
  spinner.start();
  const result = await operation;
  spinner.stop();
  console.log("");
  console.log(endMessage);

  return result;
};

const pk = process.env.PK;
const rpcUrl = process.env.RPC_URL;
const governanceToken = process.env.GOVERNANCE_TOKEN;
const burnAddress = process.env.BURN_ADDRESS;

if (![pk, rpcUrl, governanceToken, burnAddress].find((v) => !!v)) {
  console.log(
    chalk.redBright`Couldn't find env variables. Have you renamed ` +
      chalk.red.bold.underline`deploy/.env.dist` +
      chalk.redBright` to ` +
      chalk.red.bold.underline(`deploy/.env`)
  );

  process.exit(-1);
}

if (!pk) {
  missingEnvVarLog("PK");
  process.exit(-1);
}

if (!rpcUrl) {
  missingEnvVarLog("RPC_URL");
  process.exit(-1);
}

if (!governanceToken) {
  missingEnvVarLog("GOVERNANCE_TOKEN");
  process.exit(-1);
}

if (!burnAddress) {
  missingEnvVarLog("BURN_ADDRESS");
  process.exit(-1);
}

// Initialize RPC connection
const Tezos = new TezosToolkit(process.env.RPC_URL);

// Deploy to configured node with configured secret key
const deploy = async () => {
  try {
    const signer = await InMemorySigner.fromSecretKey(process.env.PK);

    Tezos.setProvider({ signer });

    // create a JavaScript object to be used as initial storage
    // https://tezostaquito.io/docs/originate/#a-initializing-storage-using-a-plain-old-javascript-object
    const storage = {
      metadata: MichelsonMap.fromLiteral({
        "": buf2hex(Buffer.from("tezos-storage:contents")),
        contents: buf2hex(Buffer.from(JSON.stringify(metadata))),
      }),
      // ^ contract metadata (tzip-16)
      // https://tzip.tezosagora.org/proposal/tzip-16/

      governanceToken,

      vault: new MichelsonMap(),
      // ^ should be left empty,
      // unless you want to fill-in some values for test purpose

      config: {
        depositAmount: 4,
        refundThreshold: 32,
        quorumThreshold: 67,
        superMajority: 80,
        startDelay: 86400, // one day
        votingPeriod: 604800, // one week
        timelockDelay: 86400,
        timelockPeriod: 259200, // 3 days
        burnAddress,
      },
      // ^ example configuration

      nextOutcomeId: 1,
      // ^ this should always be initialized with 1n

      outcomes: new MichelsonMap(),
      // ^ should be left empty,
      // unless you want to fill-in some values for test purpose
    };

    const origination = await makeSpinnerOperation(
      Tezos.contract.originate({ code, storage }),
      {
        loadingMessage: chalk.yellowBright`Deploying contract`,
        endMessage: chalk.green`Contract deployed!`,
      }
    );

    await makeSpinnerOperation(origination.contract(), {
      loadingMessage:
        chalk.yellowBright`Waiting for contract to be confirmed at: ` +
        chalk.yellow.bold(origination.contractAddress),
      endMessage: chalk.green`Contract confirmed!`,
    });

    console.log(
      chalk.green`\nContract address: \n- ` +
        chalk.green.underline`${origination.contractAddress}`
    );
  } catch (e) {
    console.log("");
    console.log(chalk.redBright`Error during deployment:`);
    console.log(e);

    process.exit(1);
  }
};

deploy();
