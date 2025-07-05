import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileStack,
  MousePointer2,
  ScrollText,
  Waypoints,
  BetweenHorizontalEnd,
} from "lucide-react";
import { Hourglass, MutatingDots } from "react-loader-spinner";

type StateDescription = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type StateDescriptions = {
  [key: string]: StateDescription;
};

const stateDescriptions: StateDescriptions = {
  summarizing_history: {
    title: "Summarizing History",
    description: "Summarizing the history of the chat",
    icon: FileStack,
  },
  selecting_mode: {
    title: "Selecting Mode",
    description: "Selecting the mode of the chat",
    icon: MousePointer2,
  },
  retriving_context: {
    title: "Retrieving Context",
    description: "Retrieving the context of the chat",
    icon: ScrollText,
  },
  refining_query: {
    title: "Refining Query",
    description: "Refining the query based on the context",
    icon: BetweenHorizontalEnd,
  },
  loading_model: {
    title: "Loading Model",
    description: "Loading the model for the chat",
    icon: Waypoints,
  },
};

export default function OutputStateCard({
  outputState,
}: {
  outputState: string;
}) {
  const IconComponent = stateDescriptions[outputState].icon;

  return (
    <Card className="w-full max-w-xs border-none shadow-lg">
      <CardHeader>
        <div className="flex flex-row gap-2 justify-between items-center">
          <div>
            <CardTitle className="mb-2">
              <span className="flex items-center gap-2 animate-pulse">
                {stateDescriptions[outputState].title}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {stateDescriptions[outputState].description}
            </CardDescription>
          </div>
          {/* <Hourglass
            visible={true}
            height="30"
            width="30"
            ariaLabel="hourglass-loading"
            wrapperStyle={{}}
            wrapperClass=""
            colors={["#888888", "#444444"]}
          /> */}
          {IconComponent && <IconComponent className="w-15 h-15" />}
        </div>
      </CardHeader>
    </Card>
  );
}
