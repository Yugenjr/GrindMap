import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CircularProgress from "./CircularProgress";

const PlatformCardSkeleton = ({ platform }) => {
  return (
    <div className="platform-card">
      <div className="card-header">
        <Skeleton width={120} height={22} />
        <div className="platform-progress">
          <CircularProgress percentage={0} color="#ddd" size="medium" />
        </div>
      </div>

      <div className="summary">
        <Skeleton width={160} height={14} />
        <Skeleton width={120} height={14} />
        <Skeleton width={140} height={14} />
      </div>
    </div>
  );
};

export default PlatformCardSkeleton;
