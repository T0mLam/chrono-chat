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
  PictureInPicture,
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
    description:
      "Summarizing the past {message_count} messages",
    icon: FileStack,
  },
  selecting_mode: {
    title: "Selecting Mode",
    description: "Selecting the retrieval mode of the videos",
    icon: MousePointer2,
  },
  retrieving_context: {
    title: "Retrieving Video Context",
    description: "Retrieving the context of the video {video_index} ({video_name})",
    icon: ScrollText,
  },
  summarizing_context: {
    title: "Summarizing Video",
    description: "Summarizing the context of the video {video_index} ({video_name})",
    icon: PictureInPicture,
  },
  refining_query: {
    title: "Refining Query",
    description: "Refining the query based on the context",
    icon: BetweenHorizontalEnd,
  },
  loading_model: {
    title: "Loading Model",
    description: "Loading the {model} model for response generation",
    icon: Waypoints,
  },
};

// Helper function to format state description with parameters
// Supports variables like {model}, {video_name}, {message_count}, {video_index}
// Special handling for video_index to add " from Video X" format
function formatStateDescription(
  template: string,
  params: Record<string, string> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    if (value) {
      return value.length > 15 ? value.slice(0, 15) + "..." : value;
    }
    // Remove the placeholder if no value is provided
    return "";
  });
}

export default function OutputStateCard({
  params = {},
}: {
  params: Record<string, string>;
}) {
  const IconComponent = stateDescriptions[params.status].icon;
  const stateDescription = stateDescriptions[params.status];

  const formattedTitle = formatStateDescription(stateDescription.title, params);
  const formattedDescription = formatStateDescription(
    stateDescription.description,
    params
  );

  return (
    <Card className="w-full max-w-md border border-gray-100 shadow-lg">
      <CardHeader>
        <div className="flex flex-row gap-2 justify-between items-center">
          <div>
            <CardTitle className="mb-2 animate-pulse">
              <span className="flex items-center gap-2">{formattedTitle}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {formattedDescription}
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
          {IconComponent && <IconComponent className="w-7 h-7 animate-pulse" />}
        </div>
      </CardHeader>
    </Card>
  );
}
