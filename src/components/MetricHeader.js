import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const MetricHeader = ({ label, description, className }) => (
  <th scope="col" className={className || "p-3 text-center font-semibold"}>
    <Tooltip>
      <TooltipTrigger className="cursor-help underline decoration-dotted">
        {label}
      </TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  </th>
);