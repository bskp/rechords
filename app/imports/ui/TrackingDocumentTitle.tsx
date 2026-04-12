import * as React from "react";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import { useLocation } from "react-router-dom";
import { Meteor } from "meteor/meteor";

interface TrackingDocumentTitleProps {
  title: string;
  track_as?: string;
}

export const usePageTracking = (title: string, track_as?: string) => {
  const location = useLocation();
  const { trackPageView } = useMatomo();
  const pathname = track_as || location.pathname;

  React.useEffect(() => {
    document.title = title;

    trackPageView({
      customDimensions: [
        {
          id: 1,
          value: Meteor.user()?.profile.name,
        },
        {
          id: 2,
          value: Meteor.user()?.profile.role,
        },
      ],
    });
  }, [pathname, title]);
};

/**
 * Just a wrapper element in order to use in Route Tsx 
 * 
 * could probably be used directly as a hook but one step at the time
 * @returns 
 */
const TrackingDocumentTitle = ({ title, track_as }: TrackingDocumentTitleProps) => {
  usePageTracking(title, track_as);
  return null;
};

export default TrackingDocumentTitle;