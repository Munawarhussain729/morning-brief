import { refreshMorningBrief } from "@/src/scheduler/refreshJob";

refreshMorningBrief()
  .then((briefId) => {
    console.log(`Generated brief ${briefId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
